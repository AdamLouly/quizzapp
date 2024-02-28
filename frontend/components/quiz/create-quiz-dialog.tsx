import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "../ui/use-toast";

export default function CreateQuizDialog({
  handleQuizCreated,
  open,
  setOpen,
  onOpenChange,
}: {
  handleQuizCreated: any;
  open: any;
  setOpen: any;
  onOpenChange: any;
}) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const { data: session }: { data: any } = useSession();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Validation function
  const validate = () => {
    if (!title || !description) {
      setError("Title and description are required.");
      return false;
    }
    if (duration && parseInt(duration, 10) <= 0) {
      setError("Duration must be a positive number.");
      return false;
    }
    setError(null); // Clear error if validation succeeds
    return true;
  };

  const saveQuiz = async () => {
    if (!validate()) return; // Validate before saving

    const quizData = {
      title,
      description,
      class: selectedClass,
      due_date: date ? date.toISOString() : null,
      duration: parseInt(duration, 10),
      createdByEmail: session.user.email,
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/quizzes/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(quizData),
        },
      );

      const data = await response.json();

      handleQuizCreated(data);
      setTitle("");
      setDescription("");
      setSelectedClass("");
      setDate(null);
      setDuration("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Quiz creation error.",
      });
      console.error("Error saving quiz:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="ml-auto" size="sm">
          Create Quiz
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Quiz Details</DialogTitle>
          <DialogDescription>Enter the details for your quiz</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title">Title*</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter the quiz title"
              required
            />
          </div>
          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description*</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter the quiz description"
              required
              className="h-32"
            />
          </div>
          {/* Class Selection */}
          <div className="space-y-2">
            <Label htmlFor="class">Class</Label>
            <Select onValueChange={setSelectedClass} value={selectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls: any) => (
                  <SelectItem key={cls._id} value={cls._id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Due Date and Duration */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (Minutes)</Label>
              <Input
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
                type="number"
              />
            </div>
          </div>
        </div>
        {error && <p className="text-red-500">{error}</p>}

        <DialogFooter>
          <Button type="button" onClick={saveQuiz}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
