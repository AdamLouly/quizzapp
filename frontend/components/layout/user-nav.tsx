"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { navItems } from "@/constants/data";
import { Skeleton } from "@nextui-org/react";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
export function UserNav() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [userState, setUserState] = useState<any>([]);
  const [loadingUserState, setLoadingUserState] = useState(true);
  useEffect(() => {
    if (session) {
      setUserState(session?.user);
      setLoadingUserState(false);
    }
  }, [session]);
  if (session) {
    return (
      <Skeleton isLoaded={!loadingUserState}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={
                    userState?.image ??
                    `https://ui-avatars.com/api/?name=${userState.username}`
                  }
                  alt={userState?.username ?? ""}
                />
                <AvatarFallback>{userState?.username?.[0]}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {userState?.name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userState?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem href="/dashboard/profile">
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Settings
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                toast({
                  variant: "success",
                  title: "Successfully signed out.",
                });
                signOut({ callbackUrl: "/" });
              }}
            >
              Log out
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Skeleton>
    );
  }
}
