import { Sidebar } from "flowbite-react";
import { HiChartPie, HiInbox, HiViewBoards, HiMenu, HiX } from "react-icons/hi";
import { Outlet, useLocation } from "react-router-dom";
import { Bounce, ToastContainer } from "react-toastify";
import DatabaseModeWrapper from "./DatabaseModeWrapper";
import AiChatWidget from "./AiChatWidget";
import { useState, useEffect } from "react";

function RootComponent() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

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
            <DatabaseModeWrapper>
                <div className="w-full h-full overflow-hidden bg-fuchsia-50 relative">
                    {/* Mobile Header with Hamburger */}
                    <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b shadow-sm z-30 relative">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 rounded-lg hover:bg-gray-100 active:scale-95 transition-all"
                            aria-label="Toggle sidebar"
                        >
                            {sidebarOpen ? (
                                <HiX className="w-6 h-6 text-gray-700" />
                            ) : (
                                <HiMenu className="w-6 h-6 text-gray-700" />
                            )}
                        </button>
                        <span className="font-bold text-gray-700 text-lg">SIMRS User</span>
                    </div>

                    {/* Mobile Sidebar Backdrop */}
                    {sidebarOpen && (
                        <div
                            className="md:hidden fixed inset-0 bg-black/40 z-40 transition-opacity"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}

                    <div className="grid md:grid-cols-[16rem_1fr] grid-cols-1 gap-0 md:gap-6 h-full w-full">
                        {/* Sidebar — Desktop: static, Mobile: overlay drawer */}
                        <div className={`
                            md:relative md:translate-x-0 md:block
                            fixed top-0 left-0 h-full z-50 w-64
                            transform transition-transform duration-300 ease-in-out
                            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                            md:z-auto
                        `}>
                            <Sidebar aria-label="Default sidebar example" className="h-full">
                                {/* Mobile close button inside sidebar */}
                                <div className="md:hidden flex items-center justify-between px-2 py-3 border-b mb-2">
                                    <span className="font-bold text-gray-700">Menu</span>
                                    <button
                                        onClick={() => setSidebarOpen(false)}
                                        className="p-1 rounded-lg hover:bg-gray-100"
                                    >
                                        <HiX className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
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
                        </div>

                        {/* Main content area */}
                        <div className="overflow-auto h-full">
                            <Outlet />
                        </div>
                    </div>
                </div>
            </DatabaseModeWrapper>
            <AiChatWidget />
        </>
    )
}

export default RootComponent