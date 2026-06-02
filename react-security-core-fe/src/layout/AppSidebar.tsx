import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Building2,
  ChevronRight,
  FileText,
  Settings,
  Users,
  Briefcase,
  Database,
  Shield,
  Menu,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuthStore, hasAuthority } from '@/store/auth.store';
import { currentUserMenuPermissionApi } from '@/api/security.api';

type NavItem = {
  menuId: string;
  to: string;
  label: string;
  icon: React.ReactNode;
  children?: NavItem[];
};

type NavGroup = {
  id: string;
  menuId: string;
  label: string;
  icon: React.ReactNode;
  children: NavItem[];
  requiresAdmin?: boolean;
};

function buildTree(isAdmin: boolean): NavGroup[] {
  const groups: NavGroup[] = [
    {
      id: 'entities',
      menuId: 'entities',
      label: 'Entities',
      icon: <Database className="h-4 w-4" aria-hidden />,
      children: [
        { menuId: 'entities.organizations', to: '/organizations', label: 'Organizations', icon: <Building2 className="h-4 w-4" aria-hidden /> },
        { menuId: 'entities.employees', to: '/employees', label: 'Employees', icon: <Users className="h-4 w-4" aria-hidden /> },
      ],
    },
    {
      id: 'master-data',
      menuId: 'master-data',
      label: 'Master Data',
      icon: <Briefcase className="h-4 w-4" aria-hidden />,
      children: [
        { menuId: 'master-data.departments', to: '/departments', label: 'Departments', icon: <Users className="h-4 w-4" aria-hidden /> },
      ],
    },
    {
      id: 'reports',
      menuId: 'reports',
      label: 'Reports',
      icon: <BarChart3 className="h-4 w-4" aria-hidden />,
      children: [
        {
          menuId: 'reports.report01',
          to: '/reports/report01',
          label: 'Report 01',
          icon: <FileText className="h-4 w-4" aria-hidden />,
          children: [{ menuId: 'reports.report01.detail', to: '/reports/report01/detail', label: 'Detail', icon: <FileText className="h-4 w-4" aria-hidden /> }],
        },
        {
          menuId: 'reports.report02',
          to: '/reports/report02',
          label: 'Report 02',
          icon: <FileText className="h-4 w-4" aria-hidden />,
          children: [{ menuId: 'reports.report02.detail', to: '/reports/report02/detail', label: 'Detail', icon: <FileText className="h-4 w-4" aria-hidden /> }],
        },
      ],
    },
  ];

  if (isAdmin) {
    groups.push({
      id: 'admin',
      menuId: 'admin',
      label: 'Administration',
      icon: <Settings className="h-4 w-4" aria-hidden />,
      requiresAdmin: true,
      children: [
        { menuId: 'admin.users', to: '/admin/users', label: 'User Management', icon: <Users className="h-4 w-4" aria-hidden /> },
        {
          menuId: 'admin.security',
          to: '/admin/security',
          label: 'Security',
          icon: <Shield className="h-4 w-4" aria-hidden />,
          children: [
            { menuId: 'admin.security.roles', to: '/admin/security/roles', label: 'Roles', icon: <Shield className="h-4 w-4" aria-hidden /> },
            { menuId: 'admin.security.menu-definitions', to: '/admin/security/menu-definitions', label: 'Menu Definitions', icon: <Menu className="h-4 w-4" aria-hidden /> },
          ],
        },
      ],
    });
  }

  return groups;
}

/** Recursively keep only items whose menuId is allowed; drop branches that end up empty. */
function filterItems(items: NavItem[], allowed: Set<string>): NavItem[] {
  const result: NavItem[] = [];
  for (const item of items) {
    const filteredChildren = item.children ? filterItems(item.children, allowed) : undefined;
    const selfAllowed = allowed.has(item.menuId);
    const childrenAllowed = (filteredChildren?.length ?? 0) > 0;
    if (!selfAllowed && !childrenAllowed) continue;
    result.push({ ...item, children: filteredChildren });
  }
  return result;
}

function filterTree(groups: NavGroup[], allowed: Set<string>): NavGroup[] {
  return groups
    .map((group) => ({ ...group, children: filterItems(group.children, allowed) }))
    .filter((g) => g.children.length > 0 || allowed.has(g.menuId));
}

function pathMatchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function navItemMatchesPath(pathname: string, item: NavItem): boolean {
  if (pathMatchesPrefix(pathname, item.to)) return true;
  return item.children?.some((c) => navItemMatchesPath(pathname, c)) ?? false;
}

function NavLeafOrBranch({ item, pathname }: { item: NavItem; pathname: string }) {
  if (item.children?.length) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={navItemMatchesPath(pathname, item)} tooltip={item.label}>
          <NavLink to={item.to}>
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        </SidebarMenuButton>
        <SidebarMenuSub>
          {item.children.map((child) => (
            <SidebarMenuSubItem key={child.to}>
              <SidebarMenuSubButton asChild isActive={navItemMatchesPath(pathname, child)}>
                <NavLink to={child.to}>{child.label}</NavLink>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={navItemMatchesPath(pathname, item)} tooltip={item.label}>
        <NavLink to={item.to}>
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavGroupMasterLeaves({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <SidebarMenuSub>
      {items.map((item) => (
        <SidebarMenuSubItem key={item.to}>
          <SidebarMenuSubButton asChild isActive={navItemMatchesPath(pathname, item)}>
            <NavLink to={item.to}>
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  );
}

function SidebarNavGroups() {
  const location = useLocation();
  const pathname = location.pathname;
  const { account, isAuthenticated } = useAuthStore();
  const isAdmin = hasAuthority(account, 'ROLE_ADMIN');

  const allowedQuery = useQuery({
    queryKey: ['security', 'menu-permissions', 'security-core'],
    queryFn: () => currentUserMenuPermissionApi.getAllowed('security-core'),
    enabled: isAuthenticated && !isAdmin, // admins bypass filter
    staleTime: 60_000,
  });

  const tree = useMemo(() => {
    const fullTree = buildTree(isAdmin);
    if (isAdmin) return fullTree;
    if (!allowedQuery.data) return []; // hide all until permissions resolve
    return filterTree(fullTree, new Set(allowedQuery.data.allowedMenuIds));
  }, [isAdmin, allowedQuery.data]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      tree.map((g) => [g.id, g.children.some((c) => navItemMatchesPath(pathname, c))]),
    ),
  );

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const g of tree) {
        if (g.children.some((c) => navItemMatchesPath(pathname, c)) && !prev[g.id]) {
          next[g.id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {tree.map((group) => {
        const open = !!expanded[group.id];
        const setOpen = (next: boolean) => setExpanded((prev) => ({ ...prev, [group.id]: next }));
        const allLeaves = group.children.every((c) => !c.children?.length);

        return (
          <SidebarGroup key={group.id} className="py-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible w-full min-w-0">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={group.label}>
                      {group.icon}
                      <span>{group.label}</span>
                      <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90" aria-hidden />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {allLeaves ? (
                      <NavGroupMasterLeaves items={group.children} pathname={pathname} />
                    ) : (
                      <SidebarMenu className="gap-0.5 border-none px-0 shadow-none">
                        {group.children.map((item) => (
                          <NavLeafOrBranch key={item.to} item={item} pathname={pathname} />
                        ))}
                      </SidebarMenu>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        );
      })}
    </>
  );
}

function CloseMobileSidebarOnNavigate() {
  const { isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [location.pathname, location.search, isMobile, setOpenMobile]);

  return null;
}

export function AppSidebar() {
  return (
    <>
      <CloseMobileSidebarOnNavigate />
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarContent className="gap-0 overflow-x-hidden">
          <SidebarNavGroups />
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </>
  );
}
