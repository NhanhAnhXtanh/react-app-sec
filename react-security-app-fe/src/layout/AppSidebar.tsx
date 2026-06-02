import { useEffect, useState } from 'react';
import {
  Building2,
  ChevronRight,
  Database,
  FolderTree,
  GitBranch,
  Layers,
  Plug,
  RefreshCw,
  Tag as TagIcon,
  Package,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
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

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
  children?: NavItem[];
};

type NavGroup = {
  id: string;
  label: string;
  icon: React.ReactNode;
  children: NavItem[];
};

const tree: NavGroup[] = [
  {
    id: 'catalog',
    label: 'Catalog',
    icon: <FolderTree className="h-4 w-4" aria-hidden />,
    children: [
      {
        to: '/organizations',
        label: 'Organizations',
        icon: <Building2 className="h-4 w-4" aria-hidden />,
      },
      {
        to: '/domains',
        label: 'Domains',
        icon: <FolderTree className="h-4 w-4" aria-hidden />,
      },
      {
        to: '/tags',
        label: 'Tags',
        icon: <TagIcon className="h-4 w-4" aria-hidden />,
      },
    ],
  },
  {
    id: 'metadata',
    label: 'Metadata',
    icon: <Database className="h-4 w-4" aria-hidden />,
    children: [
      {
        to: '/meta-sources',
        label: 'Meta Sources',
        icon: <Plug className="h-4 w-4" aria-hidden />,
      },
      {
        to: '/meta-sets',
        label: 'Meta Sets',
        icon: <Layers className="h-4 w-4" aria-hidden />,
      },
      {
        to: '/meta-set-versions',
        label: 'Meta Set Versions',
        icon: <GitBranch className="h-4 w-4" aria-hidden />,
      },

      {
        to: '/meta-syncs',
        label: 'Meta Syncs',
        icon: <RefreshCw className="h-4 w-4" aria-hidden />,
      },
      {
        to: '/metapacks',
        label: 'MetaPacks',
        icon: <Package className="h-4 w-4" aria-hidden />,
      },
    ],
  },
];

function pathMatchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function navItemMatchesPath(pathname: string, item: NavItem): boolean {
  if (pathMatchesPrefix(pathname, item.to)) return true;
  return item.children?.some((c) => navItemMatchesPath(pathname, c)) ?? false;
}

function NavLeafOrBranch({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string;
}) {
  if (item.children?.length) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={navItemMatchesPath(pathname, item)}
          tooltip={item.label}
        >
          <NavLink to={item.to}>
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        </SidebarMenuButton>
        <SidebarMenuSub>
          {item.children.map((child) => (
            <SidebarMenuSubItem key={child.to}>
              <SidebarMenuSubButton
                asChild
                isActive={navItemMatchesPath(pathname, child)}
              >
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
      <SidebarMenuButton
        asChild
        isActive={navItemMatchesPath(pathname, item)}
        tooltip={item.label}
      >
        <NavLink to={item.to}>
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function NavGroupMasterLeaves({
  items,
  pathname,
}: {
  items: NavItem[];
  pathname: string;
}) {
  return (
    <SidebarMenuSub>
      {items.map((item) => (
        <SidebarMenuSubItem key={item.to}>
          <SidebarMenuSubButton
            asChild
            isActive={navItemMatchesPath(pathname, item)}
          >
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

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      tree.map((g) => [
        g.id,
        g.children.some((c) => navItemMatchesPath(pathname, c)),
      ]),
    ),
  );

  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const g of tree) {
        if (
          g.children.some((c) => navItemMatchesPath(pathname, c)) &&
          !prev[g.id]
        ) {
          next[g.id] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [pathname]);

  return (
    <>
      {tree.map((group) => {
        const open = !!expanded[group.id];
        const setOpen = (next: boolean) =>
          setExpanded((prev) => ({ ...prev, [group.id]: next }));

        const allLeaves = group.children.every((c) => !c.children?.length);

        return (
          <SidebarGroup key={group.id} className="py-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <Collapsible
                  open={open}
                  onOpenChange={setOpen}
                  className="group/collapsible w-full min-w-0"
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={group.label}>
                      {group.icon}
                      <span>{group.label}</span>
                      <ChevronRight
                        className="ml-auto h-4 w-4 shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90"
                        aria-hidden
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {allLeaves ? (
                      <NavGroupMasterLeaves
                        items={group.children}
                        pathname={pathname}
                      />
                    ) : (
                      <SidebarMenu className="gap-0.5 border-none px-0 shadow-none">
                        {group.children.map((item) => (
                          <NavLeafOrBranch
                            key={item.to}
                            item={item}
                            pathname={pathname}
                          />
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
