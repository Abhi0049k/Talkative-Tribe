import { FC, useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { FaMagnifyingGlass } from "react-icons/fa6";
import UserCard, { activePreviousUserI } from "./UserCard";
import { useHomeLeft } from "@/hooks/useHomeLeft";
import { HomeChildProps } from "@mangalam0049k/common";
import { useRecoilValue } from "recoil";
import { handednessState } from "@/store/atom";
import { Settings } from "lucide-react";
import SettingsModal from "./SettingsModal";
import CreateCommunityModal from "./CreateCommunityModal";
import DiscoverCommunitiesModal from "./DiscoverCommunitiesModal";
import DeleteCommunityModal from "./DeleteCommunityModal";

const HomeLeft: FC<HomeChildProps> = ({ socket }) => {
    const { name, searchList, userId, allPrevPrivateRooms, joinedCommunities, refreshCommunities, handleCommunityClick, handleChangeName, handleUserClick, handleChatWithAI, handleDeleteRoom, handleDeleteCommunity, getCurrentUserId, isDeleteModalOpen, communityToDelete, confirmDeleteCommunity, cancelDeleteCommunity } = useHomeLeft(socket);
    const handedness = useRecoilValue(handednessState);
    const isLeftHanded = handedness === 'left';
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
    const [isDiscoverCommunityOpen, setIsDiscoverCommunityOpen] = useState(false);

    return (
        <div className={`relative flex flex-col w-full sm:w-[300px] md:w-[320px] h-full border-foreground ${isLeftHanded ? 'sm:border-l-[3px] border-r-0' : 'sm:border-r-[3px]'}`}>
            {/* Search Section */}
            <div className="p-4 border-b-[3px] border-foreground bg-background">
                <div className={`flex items-stretch h-12 border-[3px] border-foreground bg-background ${isLeftHanded ? 'flex-row-reverse' : 'flex-row'}`} style={{ boxShadow: '4px 4px 0 hsl(var(--foreground))' }}>
                    {/* Icon Container */}
                    <div className={`flex items-center justify-center w-12 bg-[hsl(var(--muted))] ${isLeftHanded ? 'border-r-0 border-l-[3px]' : 'border-r-[3px] border-l-0'} border-foreground`}>
                        <FaMagnifyingGlass className="text-foreground w-5 h-5" />
                    </div>
                    {/* Input Field */}
                    <input
                        placeholder="Find someone..."
                        value={name}
                        onChange={handleChangeName}
                        className={`flex-1 bg-transparent border-none outline-none px-4 py-2 text-base font-bold tracking-wide placeholder:text-muted-foreground placeholder:font-medium uppercase ${isLeftHanded ? 'text-right' : 'text-left'} focus:bg-[hsl(var(--secondary))]/20 transition-colors`}
                    />
                </div>
            </div>

            {/* Search Results Dropdown */}
            {(name) && (
                <div
                    className="absolute z-50 left-6 right-6 sm:w-auto mx-auto"
                    style={{
                        top: "88px",
                        boxShadow: '6px 6px 0px hsl(var(--foreground))'
                    }}
                >
                    <div className="bg-background border-[3px] border-foreground flex flex-col">
                        <div className="bg-foreground text-background px-4 py-2 font-bold uppercase text-xs tracking-wider flex justify-between items-center">
                            <span>Search Results</span>
                            <span className="bg-background text-foreground px-1.5 text-[10px] border border-transparent rounded-sm">
                                {searchList.length}
                            </span>
                        </div>

                        {searchList.length === 0 ? (
                            <div className="p-6 text-center bg-background">
                                <p className="font-bold uppercase text-sm tracking-wide">
                                    No users found
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 font-medium uppercase">
                                    Try a different name
                                </p>
                            </div>
                        ) : (
                            <ScrollArea className="max-h-[300px] bg-background">
                                <div className="flex flex-col p-2 gap-2">
                                    {searchList.map((el: activePreviousUserI) => (
                                        <UserCard name={el?.name} id={el?.id} key={el?.id} handleClick={handleUserClick} options={false} />
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </div>
            )}


            <ScrollArea className="flex-1 h-full">
                <div className="flex flex-col">
                    {/* AI Chat - Always First */}
                    <div className="border-b-[3px] border-foreground">
                        <UserCard key={"ai-234"} name={"🤖 Chat with AI"} id={import.meta.env.VITE_AI_BOT_ID || ""} handleClick={handleChatWithAI} options={false} isAI={true} />
                    </div>

                    {/* Communities Section */}
                    <div className={`px-4 py-2 bg-[hsl(var(--muted))] border-b-[3px] border-foreground flex items-center justify-between ${isLeftHanded ? 'flex-row-reverse' : 'flex-row'}`}>
                        <h2 className="font-bold text-foreground uppercase tracking-wide text-xs">Communities</h2>
                        <div className={`flex gap-2 ${isLeftHanded ? 'flex-row-reverse' : 'flex-row'}`}>
                            <button onClick={() => setIsDiscoverCommunityOpen(true)} className="hover:underline text-[10px] font-bold uppercase cursor-pointer">Find</button>
                            <button onClick={() => setIsCreateCommunityOpen(true)} className="hover:underline text-[10px] font-bold uppercase cursor-pointer">Create</button>
                        </div>
                    </div>
                    <div className="border-b-[3px] border-foreground">
                        {joinedCommunities.length > 0 ? (
                            joinedCommunities.map((comm) => {
                                const currentUserId = getCurrentUserId();
                                const isOwner = currentUserId === comm.creatorId;

                                return (
                                    <UserCard
                                        key={comm.id}
                                        name={`# ${comm.name}`}
                                        id={comm.id}
                                        handleClick={() => handleCommunityClick(comm.id, comm.name)}
                                        handleDelete={handleDeleteCommunity}
                                        options={false}
                                        isCommunity={true}
                                        isOwner={isOwner}
                                    />
                                );
                            })
                        ) : (
                            <div className="p-4 text-center">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">No communities joined</p>
                            </div>
                        )}
                    </div>


                    {/* Chat List Header */}
                    <div className={`px-4 py-2 bg-[hsl(var(--secondary))] border-b-[3px] border-foreground flex items-center justify-between ${isLeftHanded ? 'flex-row-reverse' : 'flex-row'}`}>
                        <h2 className="font-bold text-black uppercase tracking-wide text-xs">Direct Messages</h2>
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-1 hidden sm:block hover:bg-black/10 rounded-sm transition-colors border-2 border-transparent hover:border-black/20"
                            title="Settings"
                        >
                            <Settings className="w-4 h-4 text-black" />
                        </button>
                    </div>

                    {/* User Chats */}
                    {allPrevPrivateRooms.length > 0 ? (
                        allPrevPrivateRooms.map((el) => {
                            const usercardName = el.creatorId !== userId ? el.creator.name : el.participant.name;
                            const usercardId = el.creatorId !== userId ? el.creatorId : el.participantId;
                            // Skip AI bot room in this list as it's pinned at top
                            if (el.participantId === import.meta.env.VITE_AI_BOT_ID || el.creatorId === import.meta.env.VITE_AI_BOT_ID) return null;

                            return (
                                <UserCard
                                    key={el.id}
                                    name={usercardName.split(' ')[0] || usercardName}
                                    id={usercardId}
                                    handleClick={handleUserClick}
                                    handleDelete={handleDeleteRoom}
                                    options={true}
                                />
                            )
                        })
                    ) : (
                        <div className="p-8 text-center bg-background">
                            <p className="text-muted-foreground font-medium uppercase text-sm tracking-wide">
                                No conversations yet
                            </p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <CreateCommunityModal
                isOpen={isCreateCommunityOpen}
                onClose={() => setIsCreateCommunityOpen(false)}
                onSuccess={refreshCommunities}
            />
            <DiscoverCommunitiesModal
                isOpen={isDiscoverCommunityOpen}
                onClose={() => setIsDiscoverCommunityOpen(false)}
                onJoinSuccess={refreshCommunities}
            />
            <DeleteCommunityModal
                isOpen={isDeleteModalOpen}
                onClose={cancelDeleteCommunity}
                onConfirm={confirmDeleteCommunity}
                communityName={communityToDelete?.name || ""}
            />
        </div>
    );
}

export default HomeLeft;