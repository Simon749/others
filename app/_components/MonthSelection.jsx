"use client"
import React, { useState } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button";
import { CalenderIcon } from "lucide-react";
import { addMonths } from "date-fns";
import moment from "moment";
import { Calendar } from "@/components/ui/calendar"

function MonthlySelection(selectedMonth) {

    const today = new Date();

    const nextMonths = addMonths(new Date(), 0);
    const [month, setMonth] = useState(nextMonths);
    return (
        <div>

            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="flex gap-2 text-slate-500">
                        <CalenderIcon className="h-5 w-5" />
                        {moment(month).format("MMMM YYYY")}
                        Month</Button>
                </PopoverTrigger>
                <PopoverContent>
                    <Calendar
                        mode="single"
                        month={month}
                        onMonthChange={(value) => {selectedMonth(value); setMonth(value)}}
                        className="flex flex-1 justify-center"
                    />
                </PopoverContent>
            </Popover>


        </div>
    )
}

export default MonthlySelection;