import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from "@/components/ui/card"
import { FC, useEffect } from "react";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link } from "react-router-dom";
import { Action } from "@/shared";
import useAuthentication from "@/hooks/useAuthentication";

const Auth: FC<{ action: Action }> = ({ action }) => {
    const { credentials, handleSubmit, loading, handleChange } = useAuthentication(action)

    useEffect(() => {
        document.title = action === Action.register ? "Register | Talkative-Tribe" : "Login | Talkative-Tribe";
    }, [action])

    return (
        <div className="w-full h-screen flex justify-center items-center">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>{action === Action.register ? "Register" : "Login"}</CardTitle>
                    <CardDescription>{action === Action.login ? "Login to create or join any meet." : "Register to video call your friends and family."}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>

                        <div className="grid w-full items-center gap-4">
                            {
                                action === Action.register ? (
                                    <div className="flex flex-col space-y-1.5">
                                        <Label htmlFor="name">Name</Label>
                                        <Input type="text" name="name" value={credentials.name} id="name" placeholder="Name" onChange={handleChange} />
                                    </div>
                                ) : null
                            }
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input type="email" id="email" name="email" placeholder="Email" value={credentials.email} onChange={handleChange} />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <Input type="password" name="password" value={credentials.password} id="password" placeholder="Password" onChange={handleChange} />
                            </div>
                        </div>
                        {
                            loading ?
                                <Button className="my-4 w-full">Loading...</Button> :
                                <Button className="my-4 w-full">{action === Action.register ? "Register" : "Login"}</Button>
                        }
                    </form>
                </CardContent>
                <CardFooter className="text-center text mt-[-32px]">
                    {action === Action.register ? "Already have an account?" : "Don't have an account?"}
                    <Link to={action === Action.register ? "/login" : "/register"} className="ml-1 text-blue-500">{action === Action.register ? "Login" : "Register"}</Link>
                </CardFooter>
            </Card>
        </div>
    );
}

export default Auth