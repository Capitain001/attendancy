"use client";

import { useEffect, useMemo, useState } from "react";
// import { RiCalendarLine, RiDeleteBinLine } from "@remixicon/react";
import { RiCalendarLine, RiDeleteBinLine } from "react-icons/ri";

import { format, isBefore } from "date-fns";

import type { ScheduleEvent, EventColor } from "@/components/event-calendar";
import { colorOptions } from "@/components/event-calendar/utils";
import {
  DefaultEndHour,
  DefaultStartHour,
  EndHour,
  StartHour,
} from "@/components/event-calendar/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EventDialogProps {
  event: ScheduleEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: ScheduleEvent) => void | Promise<boolean | void>;
  onDelete: (eventId: string) => void | Promise<boolean | void>;
}

export function EventDialog({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: EventDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState(`${DefaultStartHour}:00`);
  const [endTime, setEndTime] = useState(`${DefaultEndHour}:00`);
  const [location, setLocation] = useState("");
  const [color, setColor] = useState<EventColor>("sky");
  const [error, setError] = useState<string | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title || "");
      setDescription(event.description || "");

      const start = new Date(event.start);
      const end = new Date(event.end);

      setStartDate(start);
      setEndDate(end);
      setStartTime(formatTimeForInput(start));
      setEndTime(formatTimeForInput(end));
      setLocation(event.location || "");
      setColor((event.color as EventColor) || "sky");
      setError(null);
    } else {
      resetForm();
    }
  }, [event]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStartDate(new Date());
    setEndDate(new Date());
    setStartTime(`${DefaultStartHour}:00`);
    setEndTime(`${DefaultEndHour}:00`);
    setLocation("");
    setColor("sky");
    setError(null);
  };

  const formatTimeForInput = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = Math.floor(date.getMinutes() / 15) * 15;
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  const timeOptions = useMemo(() => {
    const options = [];
    for (let hour = StartHour; hour <= EndHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        const value = `${formattedHour}:${formattedMinute}`;
        const date = new Date(2000, 0, 1, hour, minute);
        const label = format(date, "h:mm a");
        options.push({ value, label });
      }
    }
    return options;
  }, []);

  const handleSave = async () => {
    const start = new Date(startDate);
    const end = new Date(startDate);

    const [startHours = 0, startMinutes = 0] = startTime.split(":").map(Number);
    const [endHours = 0, endMinutes = 0] = endTime.split(":").map(Number);

    start.setHours(startHours, startMinutes, 0);
    end.setHours(endHours, endMinutes, 0);

    if (isBefore(end, start)) {
      setError("L’heure de fin ne peut pas précéder le début.");
      return;
    }

    await Promise.resolve(
      onSave({
        id: event?.id || "",
        title: title.trim() || "(sans titre)",
        description: description || "",
        start,
        end,
        location,
        color,
        meta: event?.meta || {
          ruleId: "",
          courseId: "",
          teacherId: "",
          roomId: "",
        },
      })
    );
  };

  const handleDelete = () => {
    if (event?.id) {
      void Promise.resolve(onDelete(event.id));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    </Dialog>

  );
}


/* 



*/