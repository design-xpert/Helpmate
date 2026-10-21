"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Clock as ClockIcon } from "lucide-react";
import { isPastTime, formatDDMMYYYY } from "@/utils/dateTime";

interface InlineCustomDatePickerProps {
  selectedDate: string | null;
  onSelectDate: (dateISO: string) => void;
}

interface InlineCustomTimePickerProps {
  selectedTime: string | null;
  onSelectTime: (time12h: string) => void;
  selectedDate?: string | null;
}

export function InlineCustomDatePicker({
  selectedDate,
  onSelectDate
}: InlineCustomDatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const [viewYear, setViewYear] = useState(isNaN(initialDate.getFullYear()) ? today.getFullYear() : initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(isNaN(initialDate.getMonth()) ? today.getMonth() : initialDate.getMonth());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

  const isPrevDisabled = viewYear < today.getFullYear() || (viewYear === today.getFullYear() && viewMonth <= today.getMonth());

  const handlePrevMonth = () => {
    if (isPrevDisabled) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleReset = () => {
    const todayISO = new Date().toISOString().split("T")[0];
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onSelectDate(todayISO);
  };

  return (
    <div className="w-full max-w-[330px] sm:max-w-[360px] mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4.5 shadow-2xl space-y-3.5 text-left">
      {/* Header Month & Year Selectors */}
      <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
        <button
          type="button"
          disabled={isPrevDisabled}
          onClick={handlePrevMonth}
          className={`p-1.5 rounded-xl transition-colors ${
            isPrevDisabled
              ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
              : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          }`}
        >
          <ChevronLeft className="w-4.5 h-4.5" />
        </button>

        <div className="flex items-center gap-2">
          {/* Month Select Pill */}
          <div className="relative">
            <select
              value={viewMonth}
              onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
              className="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-extrabold px-3.5 py-1.5 pr-7 rounded-full cursor-pointer focus:outline-none border border-transparent hover:border-slate-300"
            >
              {monthNames.map((m, idx) => {
                const isPastMonth = viewYear === today.getFullYear() && idx < today.getMonth();
                return (
                  <option key={m} value={idx} disabled={isPastMonth}>
                    {m} {isPastMonth ? "(Past)" : ""}
                  </option>
                );
              })}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 pointer-events-none">▼</span>
          </div>

          {/* Year Select Pill */}
          <div className="relative">
            <select
              value={viewYear}
              onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
              className="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-extrabold px-3.5 py-1.5 pr-7 rounded-full cursor-pointer focus:outline-none border border-transparent hover:border-slate-300"
            >
              {[today.getFullYear(), today.getFullYear() + 1, today.getFullYear() + 2, today.getFullYear() + 3].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 pointer-events-none">▼</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
        >
          <ChevronRight className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Days Headers */}
      <div>
        <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
          {dayNames.map((d) => (
            <span key={d} className="text-[11px] font-bold text-slate-400">
              {d}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} />
          ))}

          {Array.from({ length: totalDays }).map((_, idx) => {
            const dayNum = idx + 1;
            const cellDate = new Date(viewYear, viewMonth, dayNum);
            cellDate.setHours(0, 0, 0, 0);

            const isPast = cellDate < today;
            const yearStr = viewYear;
            const monthStr = (viewMonth + 1).toString().padStart(2, "0");
            const dayStr = dayNum.toString().padStart(2, "0");
            const iso = `${yearStr}-${monthStr}-${dayStr}`;

            const isSelected = selectedDate === iso;

            return (
              <button
                key={iso}
                type="button"
                disabled={isPast}
                onClick={() => onSelectDate(iso)}
                className={`h-8.5 w-full rounded-xl flex items-center justify-center text-xs font-black transition-all duration-150 ${
                  isSelected
                    ? "bg-[#782860] text-white shadow-md shadow-[#782860]/30 scale-105"
                    : isPast
                    ? "text-slate-300 dark:text-slate-700 cursor-not-allowed line-through opacity-40 pointer-events-none"
                    : "text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                }`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Reset Section */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-400 truncate">
          {selectedDate ? formatDDMMYYYY(selectedDate) : "Select date"}
        </span>
        <button
          type="button"
          onClick={handleReset}
          className="px-3 py-1 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>
    </div>
  );
}

export function InlineCustomTimePicker({
  selectedTime,
  onSelectTime,
  selectedDate
}: InlineCustomTimePickerProps) {
  const parse12Time = (timeStr: string | null) => {
    if (!timeStr) return { hour: "09", minute: "00", ampm: "AM" };
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      let [_, h, m, a] = match;
      const hNum = parseInt(h, 10);
      const formattedH = hNum < 10 ? `0${hNum}` : `${hNum}`;
      return { hour: formattedH, minute: m, ampm: a.toUpperCase() };
    }
    return { hour: "09", minute: "00", ampm: "AM" };
  };

  const initial = parse12Time(selectedTime);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [ampm, setAmpm] = useState<"AM" | "PM">(initial.ampm as "AM" | "PM");
  const [activeStep, setActiveStep] = useState<"hour" | "minute">("hour");

  const hours = [
    { label: "12", val: "12" },
    { label: "1", val: "01" },
    { label: "2", val: "02" },
    { label: "3", val: "03" },
    { label: "4", val: "04" },
    { label: "5", val: "05" },
    { label: "6", val: "06" },
    { label: "7", val: "07" },
    { label: "8", val: "08" },
    { label: "9", val: "09" },
    { label: "10", val: "10" },
    { label: "11", val: "11" },
  ];

  const minutes = [
    { label: ":00", val: "00" },
    { label: ":05", val: "05" },
    { label: ":10", val: "10" },
    { label: ":15", val: "15" },
    { label: ":20", val: "20" },
    { label: ":25", val: "25" },
    { label: ":30", val: "30" },
    { label: ":35", val: "35" },
    { label: ":40", val: "40" },
    { label: ":45", val: "45" },
    { label: ":50", val: "50" },
    { label: ":55", val: "55" },
  ];

  const handleSelectHour = (hVal: string) => {
    setHour(hVal);
    // When hour selected -> switch to minute dial step
    setActiveStep("minute");
  };

  const handleSelectMinute = (mVal: string) => {
    setMinute(mVal);
    // When minute selected -> update time and trigger parent callback
    onSelectTime(`${hour}:${mVal} ${ampm}`);
  };

  const handleToggleAmpm = (period: "AM" | "PM") => {
    setAmpm(period);
    onSelectTime(`${hour}:${minute} ${period}`);
  };

  return (
    <div className="w-full max-w-[330px] sm:max-w-[360px] mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4.5 shadow-2xl space-y-3.5 text-left">
      {/* Clock Display Header */}
      <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClockIcon className="w-4 h-4 text-[#782860]" />
          <div className="flex items-center gap-1 text-lg font-black text-foreground">
            <button
              type="button"
              onClick={() => setActiveStep("hour")}
              className={`hover:text-[#782860] cursor-pointer transition-colors px-1.5 py-0.5 rounded-lg ${
                activeStep === "hour" ? "bg-[#782860]/10 text-[#782860] underline" : ""
              }`}
            >
              {hour}
            </button>
            <span>:</span>
            <button
              type="button"
              onClick={() => setActiveStep("minute")}
              className={`hover:text-[#782860] cursor-pointer transition-colors px-1.5 py-0.5 rounded-lg ${
                activeStep === "minute" ? "bg-[#782860]/10 text-[#782860] underline" : ""
              }`}
            >
              {minute}
            </button>
          </div>
        </div>

        {/* AM / PM Selector */}
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
          {(["AM", "PM"] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => handleToggleAmpm(period)}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                ampm === period
                  ? "bg-[#782860] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-foreground"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 gap-4 pb-1.5">
        <button
          type="button"
          onClick={() => setActiveStep("hour")}
          className={`text-xs font-extrabold cursor-pointer pb-0.5 transition-all ${
            activeStep === "hour"
              ? "text-[#782860] border-b-2 border-[#782860]"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          1. Select Hour ({hour})
        </button>
        <button
          type="button"
          onClick={() => setActiveStep("minute")}
          className={`text-xs font-extrabold cursor-pointer pb-0.5 transition-all ${
            activeStep === "minute"
              ? "text-[#782860] border-b-2 border-[#782860]"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          2. Select Minute (:{minute})
        </button>
      </div>

      {/* 360° Circular Clock Dials (Hour step & Minute step) */}
      {activeStep === "hour" ? (
        <div>
          <div className="relative w-48 h-48 mx-auto rounded-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200/80 dark:border-slate-800 flex items-center justify-center p-2 shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-[#782860] z-10" />

            {hours.map((hObj, idx) => {
              const angle = (idx * 30 - 90) * (Math.PI / 180);
              const radius = 68; // medium radius
              const x = Math.round(radius * Math.cos(angle));
              const y = Math.round(radius * Math.sin(angle));

              const isSelected = hour === hObj.val;
              // Hour is past if the latest minute of that hour (:59) has passed for selected date
              const isPastHour = isPastTime(`${hObj.val}:59 ${ampm}`, selectedDate);

              return (
                <button
                  key={hObj.val}
                  type="button"
                  disabled={isPastHour}
                  onClick={() => handleSelectHour(hObj.val)}
                  style={{
                    transform: `translate(${x}px, ${y}px)`
                  }}
                  className={`absolute w-7.5 h-7.5 rounded-full font-black text-xs flex items-center justify-center transition-all ${
                    isPastHour
                      ? "opacity-30 cursor-not-allowed line-through text-slate-300 dark:text-slate-700 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pointer-events-none"
                      : isSelected
                      ? "bg-[#782860] text-white shadow-md shadow-[#782860]/40 scale-110 z-20 cursor-pointer"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-[#782860]/10 cursor-pointer"
                  }`}
                >
                  {hObj.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Minute Clock Dial (360° Circular like Hour dial!) */
        <div>
          <div className="relative w-48 h-48 mx-auto rounded-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200/80 dark:border-slate-800 flex items-center justify-center p-2 shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-[#782860] z-10" />

            {minutes.map((mObj, idx) => {
              const angle = (idx * 30 - 90) * (Math.PI / 180);
              const radius = 68; // medium radius
              const x = Math.round(radius * Math.cos(angle));
              const y = Math.round(radius * Math.sin(angle));

              const isSelected = minute === mObj.val;
              const isPastMinute = isPastTime(`${hour}:${mObj.val} ${ampm}`, selectedDate);

              return (
                <button
                  key={mObj.val}
                  type="button"
                  disabled={isPastMinute}
                  onClick={() => handleSelectMinute(mObj.val)}
                  style={{
                    transform: `translate(${x}px, ${y}px)`
                  }}
                  className={`absolute w-8 h-8 rounded-full font-black text-[10px] flex items-center justify-center transition-all ${
                    isPastMinute
                      ? "opacity-30 cursor-not-allowed line-through text-slate-300 dark:text-slate-700 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pointer-events-none"
                      : isSelected
                      ? "bg-[#782860] text-white shadow-md shadow-[#782860]/40 scale-110 z-20 cursor-pointer"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-[#782860]/10 cursor-pointer"
                  }`}
                >
                  {mObj.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
