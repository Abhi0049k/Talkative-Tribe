import { NextFunction, Request, Response, Router } from "express";
import prisma from "../configs/prismaInstance";
import { compare, hash } from "bcrypt";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import { userProfileT, LoginInput, LoginInputType, RegisterInput, RegisterInputType } from "@mangalam0049k/common";

export const userRouter = Router();

userRouter.post("/register", async (req: Request, res: Response, next: NextFunction) => {
    const { email, name, password }: RegisterInputType = req.body;
    const SALT_ROUNDS: number = Number(process.env.SALT_ROUNDS) || 10;
    const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY || "fallback_secret";
    try {
        const { success } = RegisterInput.safeParse({ name, email, password });
        if (!success) return next({ status: 422, message: "Invalid Input" });

        const userExists = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true } });
        if (userExists) return next({ status: 409, message: "User Already Exists" });

        const hashedPasswd: string = await hash(password, SALT_ROUNDS);
        const newUser: userProfileT = await prisma.user.create({
            data: { name, email, password: hashedPasswd },
            select: { id: true, email: true, name: true }
        });

        const token: string = sign({ id: newUser.id, name: newUser.name }, JWT_SECRET_KEY, { expiresIn: "48h" })

        // Consistent response with login
        res.status(200).send({ message: "New User Created", token });
    } catch (err) {
        console.log('/user/register', err);
        next(err);
    }
})

userRouter.post("/login", async (req: Request, res: Response, next: NextFunction) => {
    console.log("Login Request Received");
    const { email, password }: LoginInputType = req.body;
    console.log(email, password)
    const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY || "fallback_secret";
    try {
        const { success } = LoginInput.safeParse({ email, password });
        if (!success) return next({ status: 422, message: "Invalid Input" });

        const userExists = await prisma.user.findUnique({ where: { email } });
        if (!userExists) return next({ status: 404, message: "User Doesn't Exists" });

        const result = await compare(password, userExists.password);
        if (!result) return next({ status: 422, message: "Wrong Password" });

        const token: string = sign({ id: userExists.id, name: userExists.name }, JWT_SECRET_KEY, { expiresIn: "48h" })

        res.status(200).send({ message: "Login Successful", token: token });
    } catch (err) {
        console.log("Error in /user/login", err);
        next(err);
    }
})

userRouter.get("/get-username/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.status(200).send({ msg: 'Welcome' });
    } catch (err) {
        console.log(err);
        next(err);
    }
})

// Communities Endpoints

// Create Community
userRouter.post("/create-community", async (req: Request, res: Response, next: NextFunction) => {
    const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY || "";
    try {
        const token = req.headers.authorization || "";
        const user = verify(token, JWT_SECRET_KEY) as JwtPayload;
        const { name, description, accessType, allowAnonymousPosts, allowAnonymousMessages } = req.body;

        if (!name) return next({ status: 422, message: "Community name is required" });

        const existing = await prisma.community.findUnique({ where: { name } });
        if (existing) return next({ status: 409, message: "Community name already taken" });

        const community = await prisma.$transaction(async (tx) => {
            const newCommunity = await tx.community.create({
                data: {
                    name,
                    description,
                    creatorId: user.id,
                    memberIds: [user.id], // Creator joins automatically
                    accessType: accessType || "OPEN",
                    allowAnonymousPosts: allowAnonymousPosts || false,
                    allowAnonymousMessages: allowAnonymousMessages || false
                }
            });

            await tx.user.update({
                where: { id: user.id },
                data: { joinedCommunityIds: { push: newCommunity.id } }
            });

            return newCommunity;
        });

        res.status(200).send(community);
    } catch (err) {
        console.log("/create-community", err);
        next(err);
    }
});

// Get Joined Communities
userRouter.get("/communities", async (req: Request, res: Response, next: NextFunction) => {
    const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY || "";
    try {
        const token = req.headers.authorization || "";
        const user = verify(token, JWT_SECRET_KEY) as JwtPayload;

        const communities = await prisma.community.findMany({
            where: {
                memberIds: { has: user.id }
            },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        sender: {
                            select: { name: true, image: true, id: true }
                        }
                    }
                }
            }
        });

        // Sanitize last message if anonymous
        const sanitized = communities.map(c => {
            const lastMsg = c.messages[0];
            if (lastMsg && lastMsg.isAnonymous) {
                lastMsg.sender = { name: 'Anonymous', image: null, id: 'anonymous' } as any;
            }
            return c;
        });

        res.status(200).send({ communities: sanitized });
    } catch (err) {
        console.log("/communities", err);
        next(err);
    }
});

// Get Created Communities (For My Communities / Management)
userRouter.get("/my-communities", async (req: Request, res: Response, next: NextFunction) => {
    const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY || "";
    try {
        const token = req.headers.authorization || "";
        const user = verify(token, JWT_SECRET_KEY) as JwtPayload;

        const communities = await prisma.community.findMany({
            where: { creatorId: user.id }
        });

        res.status(200).send({ communities });
    } catch (err) {
        next(err);
    }
});


// Discover Communities (Search)
userRouter.get("/discover-communities", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { q } = req.query;
        const searchTerm = typeof q === 'string' ? q : '';

        const communities = await prisma.community.findMany({
            where: {
                name: { contains: searchTerm, mode: 'insensitive' }
            },
            take: 20,
            select: {
                id: true,
                name: true,
                description: true,
                accessType: true,
                pendingMemberIds: true,
                memberIds: true,
                _count: {
                    select: { members: true }
                }
            }
        });

        res.status(200).send(communities);
    } catch (err) {
        console.log("/discover-communities", err);
        next(err);
    }
});

// Join Community
userRouter.post("/join-community/:id", async (req: Request, res: Response, next: NextFunction) => {
    const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY || "";
    try {
        const token = req.headers.authorization || "";
        const user = verify(token, JWT_SECRET_KEY) as JwtPayload;
        const communityId = req.params.id;

        const community = await prisma.community.findUnique({ where: { id: communityId } });
        if (!community) return next({ status: 404, message: "Community not found" });

        if (community.memberIds.includes(user.id)) return next({ status: 400, message: "Already a member" });
        if (community.pendingMemberIds.includes(user.id)) return next({ status: 400, message: "Request already pending" });

        if (community.accessType === "REQUEST_ONLY") {
            // Add to pending
            await prisma.$transaction([
                prisma.community.update({
                    where: { id: communityId },
                    data: {
                        pendingMemberIds: { push: user.id }
                    }
                }),
                prisma.user.update({
                    where: { id: user.id },
                    data: {
                        pendingCommunityIds: { push: communityId }
                    }
                })
            ]);
            return res.status(200).send({ message: "Request sent successfully", status: "PENDING" });
        } else {
            // Add to members
            await prisma.$transaction([
                prisma.community.update({
                    where: { id: communityId },
                    data: {
                        memberIds: { push: user.id }
                    }
                }),
                prisma.user.update({
                    where: { id: user.id },
                    data: {
                        joinedCommunityIds: { push: communityId }
                    }
                })
            ]);
            return res.status(200).send({ message: "Joined successfully", status: "JOINED" });
        }
    } catch (err) {
        console.log("/join-community", err);
        next(err);
    }
});

// GET Pending Requests (Admin/Creator only)
userRouter.get("/community/:id/requests", async (req: Request, res: Response, next: NextFunction) => {
    const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY || "";
    try {
        const token = req.headers.authorization || "";
        const user = verify(token, JWT_SECRET_KEY) as JwtPayload;
        const communityId = req.params.id;

        const comm = await prisma.community.findUnique({
            where: { id: communityId },
            include: {
                pendingMembers: {
                    select: { id: true, name: true, image: true, email: true }
                }
            }
        });

        if (!comm) return next({ status: 404, message: "Community not found" });
        if (comm.creatorId !== user.id) return next({ status: 403, message: "Access denied" });

        res.status(200).send(comm.pendingMembers);
    } catch (err) {
        next(err);
    }
});

// Approve Request
userRouter.post("/community/:id/approve-request", async (req: Request, res: Response, next: NextFunction) => {
    const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY || "";
    try {
        const token = req.headers.authorization || "";
        const user = verify(token, JWT_SECRET_KEY) as JwtPayload;
        const communityId = req.params.id;
        const { userIdToApprove } = req.body;

        const comm = await prisma.community.findUnique({ where: { id: communityId } });
        if (!comm) return next({ status: 404 });
        if (comm.creatorId !== user.id) return next({ status: 403 });

        // Transaction: Move from pending to members
        await prisma.$transaction(async (tx) => {
            const newPending = comm.pendingMemberIds.filter(id => id !== userIdToApprove);

            // Add to members
            await tx.community.update({
                where: { id: communityId },
                data: {
                    pendingMemberIds: { set: newPending },
                    memberIds: { push: userIdToApprove }
                }
            });

            // Update user: Remove from pending, add to joined
            const userRecord = await tx.user.findUnique({ where: { id: userIdToApprove } });
            if (userRecord) {
                const newUserPending = userRecord.pendingCommunityIds.filter(id => id !== communityId);
                await tx.user.update({
                    where: { id: userIdToApprove },
                    data: {
                        pendingCommunityIds: { set: newUserPending },
                        joinedCommunityIds: { push: communityId }
                    }
                });
            }
        });

        res.status(200).send({ message: "Approved" });
    } catch (err) {
        next(err);
    }
});

// Reject Request
userRouter.post("/community/:id/reject-request", async (req: Request, res: Response, next: NextFunction) => {
    const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY || "";
    try {
        const token = req.headers.authorization || "";
        const user = verify(token, JWT_SECRET_KEY) as JwtPayload;
        const communityId = req.params.id;
        const { userIdToReject } = req.body;

        const comm = await prisma.community.findUnique({ where: { id: communityId } });
        if (!comm) return next({ status: 404 });
        if (comm.creatorId !== user.id) return next({ status: 403 });

        await prisma.$transaction(async (tx) => {
            const newPending = comm.pendingMemberIds.filter(id => id !== userIdToReject);

            await tx.community.update({
                where: { id: communityId },
                data: { pendingMemberIds: { set: newPending } }
            });

            const userRecord = await tx.user.findUnique({ where: { id: userIdToReject } });
            if (userRecord) {
                const newUserPending = userRecord.pendingCommunityIds.filter(id => id !== communityId);
                await tx.user.update({
                    where: { id: userIdToReject },
                    data: { pendingCommunityIds: { set: newUserPending } }
                });
            }
        });

        res.status(200).send({ message: "Rejected" });
    } catch (err) {
        next(err);
    }
});


// Get Community Members
userRouter.get("/community/:id/members", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const communityId = req.params.id;
        const community = await prisma.community.findUnique({
            where: { id: communityId },
            select: {
                memberIds: true,
                creatorId: true,
                members: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        email: true
                    }
                }
            }
        });

        if (!community) return next({ status: 404, message: "Community not found" });

        const membersWithRole = community.members.map(member => ({
            ...member,
            role: member.id === community.creatorId ? 'OWNER' : 'MEMBER'
        }));

        res.status(200).send(membersWithRole);
    } catch (err) {
        console.log("Error getting members", err);
        next(err);
    }
});


// Delete Community (Owner only)
userRouter.delete("/community/:id", async (req: Request, res: Response, next: NextFunction) => {
    const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY || "";
    try {
        const token = req.headers.authorization || "";
        const user = verify(token, JWT_SECRET_KEY) as JwtPayload;
        const communityId = req.params.id;

        const comm = await prisma.community.findUnique({ where: { id: communityId } });
        if (!comm) return next({ status: 404, message: "Community not found" });

        if (comm.creatorId !== user.id) return next({ status: 403, message: "Only owner can delete" });

        // Transactional deletion
        await prisma.$transaction(async (tx) => {
            // 1. First, clear all self-referential fields to avoid constraint violations
            // Update all messages in this community to remove reply and repost references
            await tx.communityMessage.updateMany({
                where: { communityId },
                data: {
                    replyToId: null,
                    repostId: null
                }
            });

            // 2. Delete all likes associated with community messages
            await tx.like.deleteMany({
                where: {
                    communityMessage: {
                        communityId: communityId
                    }
                }
            });

            // 3. Now we can safely delete all messages
            await tx.communityMessage.deleteMany({ where: { communityId } });

            // 4. Finally, delete the community itself
            await tx.community.delete({ where: { id: communityId } });
        });

        // 2. Cleanup Media Folder
        // Assuming uploads are stored in format: /uploads/community_<id>/ or scattered?
        // Post deletion logic in socket.ts processed individual message media.
        // A bulk delete of a community folder is cleaner if we structure it that way.
        // If we don't have a community-specific folder, we leave orphan files (technical debt),
        // or we would have to query all messages first.
        // Given current structure, we don't have a dedicated "community folder" confirmed,
        // but let's try to remove if it exists, or just accept DB deletion for now.
        // Update: Request asks to remove /uploads/community_<id>/

        try {
            const fs = require('fs');
            const path = require('path');
            const communityUploadsDir = path.join(__dirname, "../../uploads", `community_${communityId}`);
            if (fs.existsSync(communityUploadsDir)) {
                fs.rmSync(communityUploadsDir, { recursive: true, force: true });
            }
        } catch (fileErr) {
            console.error("Failed to cleanup community files:", fileErr);
        }

        // 3. Socket Emission
        const SocketIOInstance = require("../configs/socket").default;
        SocketIOInstance.instance.to(communityId).emit("community_deleted", { communityId });

        res.status(200).send({ message: "Community deleted" });
    } catch (err) {
        console.log("/delete-community", err);
        next(err);
    }
});


userRouter.get("/all-previous-private-rooms", async (req: Request, res: Response, next: NextFunction) => {
    const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY || "";
    try {
        // console.log(req.headers.authorization);
        const token = req.headers.authorization || "";
        const user = verify(token, JWT_SECRET_KEY) as JwtPayload;
        let rooms = await prisma.room.findMany({
            where: {
                OR: [
                    { creatorId: user.id },
                    { participantId: user.id }
                ]
            },
            include: {
                creator: true,
                participant: true,
                Message: {
                    take: 1
                }
            }
        })



        res.status(200).send({ rooms, id: user.id });
    } catch (err) {
        console.log("Hello all-previous-private-rooms")
        console.log(err);
        next(err);
    }
})
//SECTION - Sending User name to the client side
userRouter.post("/info", async (req: Request, res: Response, next: NextFunction) => {
    const JWT_SECRET_KEY: string = process.env.JWT_SECRET_KEY || "";
    try {
        const token = req.body.token;
        const user = verify(token, JWT_SECRET_KEY);
        res.status(200).send(user)
    } catch (err) {
        console.log("/user/info", err);
        next(err);
    }

})

userRouter.get("/logout", async (req: Request, res: Response, next: NextFunction) => {
    // res.cookie("token", "")
    console.log("Hitting Logout: ", req.body.token);
    res.status(200).send({ message: "Logged out!" });
})