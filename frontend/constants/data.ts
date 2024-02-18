import { CheckCircledIcon, CrossCircledIcon } from "@radix-ui/react-icons";

export const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "dashboard",
    label: "Dashboard",
    roles: ["admin", "teacher", "student"], // Only visible to admins
  },
  {
    title: "User Management",
    href: "/dashboard/users",
    icon: "user",
    label: "User Management",
    roles: ["admin"], // Only visible to admins
  },
  {
    title: "Class Management",
    href: "/dashboard/classes",
    icon: "class",
    label: "Class Management",
    roles: ["admin"], // Only visible to admins
  },
  {
    title: "My Quizzes",
    href: "/dashboard/my-quizzes",
    icon: "quiz",
    label: "My Quizzes",
    roles: ["teacher"], // Visible to both teachers and students
  },
  {
    title: "My Quizzes",
    href: "/dashboard/quizzes",
    icon: "quiz",
    label: "My Quizzes",
    roles: ["student"], // Visible to both teachers and students
  },
];

export const statuses = [
  {
    value: "active",
    label: "Inactive",
    icon: CheckCircledIcon,
  },
  {
    value: "inactive",
    label: "Inactive",
    icon: CrossCircledIcon,
  },
];

export const emailVerified = [
  {
    value: "active",
    label: "Inactive",
    icon: CheckCircledIcon,
  },
  {
    value: "inactive",
    label: "Inactive",
    icon: CrossCircledIcon,
  },
];
