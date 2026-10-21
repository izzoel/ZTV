import { Link } from '@inertiajs/react';
import {
    BookOpen,
    Cloud,
    Film,
    FolderGit2,
    LayoutGrid,
    ShieldCheck,
    Tv,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard, home } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard Admin',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Zetware Media Cloud',
        href: '/dashboard/cloud-media',
        icon: Cloud,
    },
    {
        title: 'Database Media',
        href: '/dashboard/database-media',
        icon: Film,
    },
    {
        title: 'Beranda Streaming',
        href: home(),
        icon: Tv,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Syarat & Ketentuan',
        href: '/terms',
        icon: ShieldCheck,
    },
    {
        title: 'Dokumentasi',
        href: 'https://github.com/izzoel/ztv',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
