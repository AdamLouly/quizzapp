"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import BreadCrumb from "@/components/breadcrumb";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const profileFormSchema = z.object({
  firstname: z.string().min(2).max(30),
  lastname: z.string().min(2).max(30),
  username: z
    .string()
    .min(2, {
      message: "Username must be at least 2 characters.",
    })
    .max(30, {
      message: "Username must not be longer than 30 characters.",
    }),
  email: z
    .string({
      required_error: "Please select an email.",
    })
    .email(),
});

const passwordSchema = z.string().min(8).max(30);

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm() {
  const user: any = useSession();
  const breadcrumbItems = [{ title: "Profile", link: "/dashboard/profile" }];
  const [password, setPassword] = useState("");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      username: "",
      email: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    form.reset({
      firstname: user.data.user.firstname,
      lastname: user.data.user.lastname,
      username: user.data.user.username,
      email: user.data.user.email,
    });
  }, [user]);

  const handleUpdateProfile = async () => {
    const formData = form.getValues();

    const initialEmail = user.data.user.email;
    const currentEmail = formData.email;

    const requestBody: any = {
      ...formData,
      password,
    };

    requestBody.oldEmail = initialEmail;
    requestBody.newEmail = initialEmail;
    if (initialEmail !== currentEmail) {
      requestBody.newEmail = currentEmail;
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/update`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (response.ok) {
      toast({
        variant: "success",
        title: "Profile Details updated",
      });
      signOut({ callbackUrl: "/" });
    } else {
      toast({
        variant: "destructive",
        title: "Failed to update profile.",
      });
    }
  };

  const { toast } = useToast();

  return (
    <>
      <Dialog>
        <div className="m-4 pb-4">
          <BreadCrumb items={breadcrumbItems} />
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleUpdateProfile)}
              className="space-y-8"
            >
              <FormField
                control={form.control}
                name="firstname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firstname</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lastname</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      This is your public display name. It can be your real name
                      or a pseudonym.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogTrigger>
                {" "}
                <Button type="button">Update profile</Button>
              </DialogTrigger>
            </form>
          </Form>
        </div>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update profile</DialogTitle>
            <DialogDescription>
              Confirm your password to update your profile.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Password
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {form.formState.errors.password && (
                <span className="text-red-600">
                  {form.formState.errors.password.message}
                </span>
              )}
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <DialogClose asChild>
              <Button type="button" onClick={handleUpdateProfile}>
                Update
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
