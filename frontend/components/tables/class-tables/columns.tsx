import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";

interface Class {
  _id: string;
  name: string;
  teacher: string;
  students: string[];
}

export const getColumns = (
  handleClassDelete: (classId: string) => void,
  teachers: Record<string, string>,
  clients: Record<string, string>,
  students: Record<string, string>,
): ColumnDef<Class>[] => [
  {
    id: "select",
    header: () => null,
    cell: () => null,
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "name",
    header: () => "Name",
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "client",
    header: () => "Client",
    cell: (info: any) => clients[info.getValue()] || "None",
  },
  {
    accessorKey: "teacher",
    header: () => "Teacher",
    cell: (info: any) => teachers[info.getValue()] || "None",
  },
  {
    accessorKey: "students",
    header: () => "Students",
    cell: (info: any) =>
      info
        .getValue()
        .map((studentId: string) => students[studentId] || "None")
        .join(", "),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <CellAction handleClassDelete={handleClassDelete} data={row.original} />
    ),
  },
];
