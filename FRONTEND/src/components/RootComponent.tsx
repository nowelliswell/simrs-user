import { Sidebar } from "flowbite-react";
import { HiChartPie, HiInbox, HiViewBoards } from "react-icons/hi";
import { Outlet } from "react-router-dom";
import { Bounce, ToastContainer } from "react-toastify";

function RootComponent() {
    return (
        <>
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss={false}
                draggable={false}
                pauseOnHover
                theme="colored"
                transition={Bounce}
            />
            <div className="w-screen h-screen overflow-hidden bg-fuchsia-50">
                <div className="grid grid-cols-[16rem_1fr] gap-6 h-full w-full">
                    <Sidebar aria-label="Default sidebar example">
                        <Sidebar.Items>
                            <Sidebar.ItemGroup>
                                <Sidebar.Item href="/" icon={HiChartPie}>
                                    Pegawai
                                </Sidebar.Item>
                                <Sidebar.Item href="/bandingkan-akses" icon={HiViewBoards}>
                                    Bandingkan Akses
                                </Sidebar.Item>
                                <Sidebar.Item href="/group-user" icon={HiInbox}>
                                    Group User
                                </Sidebar.Item>

                            </Sidebar.ItemGroup>
                        </Sidebar.Items>
                    </Sidebar>

                    <Outlet />
                </div>
            </div>
        </>
    )
}

export default RootComponent