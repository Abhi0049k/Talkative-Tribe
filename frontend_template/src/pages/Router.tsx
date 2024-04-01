import { FC, lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Loading from "@/components/Loading";
import { Action } from "@/shared";

const Home = lazy(() => import("./Home"));
const Layout = lazy(() => import("@/Layout/Layout"));
const Protected = lazy(() => import("@/components/ProtectedRoutes"));
const PageNotFound = lazy(() => import("./PageNotFound"));
const Auth = lazy(() => import("./Auth"));

const Router: FC = () => {
    return (
        <Routes>
            <Route path="/" element={<Suspense fallback={<Loading />}>
                <Protected>
                    <Layout>
                        <Home />
                    </Layout>
                </Protected>
            </Suspense>} />
            <Route path="/login" element={<Suspense fallback={<Loading />}><Auth action={Action.login} /></Suspense>} />
            <Route path="/register" element={<Suspense fallback={<Loading />}><Auth action={Action.register} /> </Suspense>} />
            <Route path="/*" element={<Suspense fallback={<Loading />}><PageNotFound /></Suspense>} />
        </Routes>
    )
}

export default Router