import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from "@/components/ui/card"
import { FC, useEffect } from "react";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, useNavigate } from "react-router-dom";
import { Action } from "@mangalam0049k/common";
import useAuthentication from "@/hooks/useAuthentication";
import { useRecoilState } from "recoil";
import { tokenState } from "@/store/atom";

const Auth: FC<{ action: Action }> = ({ action }) => {
    const { credentials, handleSubmit, loading, handleChange, error } = useAuthentication(action);
    const [token, setToken] = useRecoilState<string>(tokenState);
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            navigate('/');
        } else {
            const tkn = localStorage.getItem("token") || "";
            setToken(tkn);
            if (tkn) navigate("/");
        }
        document.title = action === Action.register ? "Register | Talkative-Tribe" : "Login | Talkative-Tribe";
    }, [action, navigate, setToken, token])

    return (
        <div className="w-full min-h-screen flex justify-center items-center bg-background p-4">
            {/* Decorative background elements */}
            <div className="fixed top-10 left-10 w-20 h-20 bg-[hsl(var(--secondary))] border-[3px] border-foreground transform rotate-12 hidden md:block" />
            <div className="fixed bottom-20 right-20 w-16 h-16 bg-foreground border-[3px] border-foreground hidden md:block" />
            <div className="fixed top-1/3 right-10 w-12 h-12 bg-[hsl(var(--secondary))] border-[3px] border-foreground transform -rotate-6 hidden lg:block" />

            <Card className="w-full max-w-[420px] border-[3px] border-foreground bg-background rounded-none" style={{ boxShadow: '8px 8px 0 hsl(var(--foreground))' }}>
                <CardHeader className="space-y-4 border-b-[3px] border-foreground pb-6">
                    {/* Brand */}
                    <div className="mb-2">
                        <span className="bg-[hsl(var(--secondary))] text-black px-2 py-1 text-sm font-bold uppercase border-[2px] border-foreground">
                            Talkative Tribe
                        </span>
                    </div>
                    <CardTitle className="text-3xl font-bold uppercase tracking-tight">
                        {action === Action.register ? "JOIN THE TRIBE" : "WELCOME BACK"}
                    </CardTitle>
                    <CardDescription className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                        {action === Action.login
                            ? "LOGIN TO CONTINUE YOUR CONVERSATIONS"
                            : "CREATE AN ACCOUNT TO START CHATTING"
                        }
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-6">
                    {/* Error Message Display */}
                    {error && (
                        <div className="mb-6 p-3 bg-[hsl(var(--destructive))] text-white border-[3px] border-foreground font-bold uppercase text-sm flex items-center gap-2" style={{ boxShadow: '4px 4px 0 hsl(var(--foreground))' }}>
                            <span className="text-xl">⚠</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="grid w-full items-center gap-5">
                            {action === Action.register && (
                                <div className="flex flex-col space-y-2">
                                    <Label htmlFor="name" className="text-sm font-bold uppercase tracking-wide">
                                        NAME
                                    </Label>
                                    <Input
                                        type="text"
                                        name="name"
                                        value={credentials.name}
                                        id="name"
                                        placeholder="YOUR NAME"
                                        onChange={handleChange}
                                        className="h-12 border-[3px] border-foreground bg-background px-4 text-base font-medium uppercase tracking-wide placeholder:text-muted-foreground focus:ring-0 focus:ring-offset-0 rounded-none"
                                    />
                                </div>
                            )}

                            <div className="flex flex-col space-y-2">
                                <Label htmlFor="email" className="text-sm font-bold uppercase tracking-wide">
                                    EMAIL
                                </Label>
                                <Input
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="YOUR@EMAIL.COM"
                                    value={credentials.email}
                                    onChange={handleChange}
                                    className="h-12 border-[3px] border-foreground bg-background px-4 text-base font-medium uppercase tracking-wide placeholder:text-muted-foreground focus:ring-0 focus:ring-offset-0 rounded-none"
                                />
                            </div>

                            <div className="flex flex-col space-y-2">
                                <Label htmlFor="password" className="text-sm font-bold uppercase tracking-wide">
                                    PASSWORD
                                </Label>
                                <Input
                                    type="password"
                                    name="password"
                                    value={credentials.password}
                                    id="password"
                                    placeholder="••••••••"
                                    onChange={handleChange}
                                    className="h-12 border-[3px] border-foreground bg-background px-4 text-base font-medium tracking-wide placeholder:text-muted-foreground focus:ring-0 focus:ring-offset-0 rounded-none"
                                />
                            </div>
                        </div>

                        <Button
                            className="mt-6 w-full h-14 text-lg"
                            style={{ boxShadow: '4px 4px 0 hsl(var(--foreground))' }}
                            disabled={loading}
                        >
                            {loading ? "LOADING..." : (action === Action.register ? "CREATE ACCOUNT →" : "LOGIN →")}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex justify-center pt-4 pb-6 border-t-[3px] border-foreground mt-4">
                    <p className="text-sm font-medium uppercase tracking-wide">
                        {action === Action.register ? "ALREADY HAVE AN ACCOUNT?" : "DON'T HAVE AN ACCOUNT?"}
                        <Link
                            to={action === Action.register ? "/login" : "/register"}
                            className="ml-2 font-bold underline underline-offset-4 hover:text-[hsl(var(--secondary))]"
                        >
                            {action === Action.register ? "LOGIN" : "REGISTER"}
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

export default Auth;