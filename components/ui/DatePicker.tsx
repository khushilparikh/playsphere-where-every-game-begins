"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function DatePicker({ value, onChange, label }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse initial date or use today
  const initialDate = value ? new Date(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  const today = new Date();
  const maxDate = today.toISOString().split('T')[0];
  const maxYear = today.getFullYear();
  const maxMonth = today.getMonth();

  // Sync calendar view with external value when it changes
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setCurrentMonth(d.getMonth());
        setCurrentYear(d.getFullYear());
      }
    }
  }, [value]);

  // Handle click outside to close popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateSelect = (day: number) => {
    const isoString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(isoString);
    setIsOpen(false);
  };

  const nextMonth = () => {
    if (currentYear === maxYear && currentMonth >= maxMonth) return; // Prevent scrolling past current month
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };
  
  const nextYear = () => {
    if (currentYear >= maxYear) return;
    setCurrentYear(y => y + 1);
    // If we jump to current year, ensure we don't land on a future month
    if (currentYear + 1 === maxYear && currentMonth > maxMonth) {
      setCurrentMonth(maxMonth);
    }
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const selectedDate = value ? new Date(value) : null;
  const isSelected = (day: number) => {
    return selectedDate?.getDate() === day && selectedDate?.getMonth() === currentMonth && selectedDate?.getFullYear() === currentYear;
  };
  const isToday = (day: number) => {
    return today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
  };
  const isFuture = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    today.setHours(0,0,0,0);
    return date > today;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative flex items-center w-full rounded-lg border border-court-line bg-court-surface focus-within:ring-2 focus-within:ring-volt/40 overflow-hidden">
        <button 
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-full items-center justify-center pl-3 pr-2 text-ink-faint hover:text-volt outline-none"
        >
          <CalendarIcon size={14} />
        </button>
        {label && <span className="text-sm font-medium text-ink-muted pl-1 pr-1 whitespace-nowrap">{label}</span>}
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          max={maxDate}
          className="w-full bg-transparent py-2 pl-1 pr-3 text-sm text-ink outline-none [&::-webkit-calendar-picker-indicator]:hidden [color-scheme:dark]"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 z-50 w-64 rounded-xl border border-court-line bg-court p-3 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setCurrentYear(y => y - 1)} className="p-1 rounded hover:bg-court-surface text-ink-muted hover:text-ink"><ChevronsLeft size={16} /></button>
              <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-court-surface text-ink-muted hover:text-ink"><ChevronLeft size={16} /></button>
            </div>
            <div className="font-medium text-sm text-ink select-none">
              {MONTHS[currentMonth]} {currentYear}
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={nextMonth} disabled={currentYear === maxYear && currentMonth >= maxMonth} className="p-1 rounded hover:bg-court-surface text-ink-muted hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"><ChevronRight size={16} /></button>
              <button type="button" onClick={nextYear} disabled={currentYear >= maxYear} className="p-1 rounded hover:bg-court-surface text-ink-muted hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"><ChevronsRight size={16} /></button>
            </div>
          </div>
          
          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {DAYS.map(day => (
              <div key={day} className="text-[10px] font-semibold tracking-wider text-ink-faint">{day}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {blanks.map(b => (
              <div key={`blank-${b}`} className="h-8 w-8" />
            ))}
            {days.map(day => {
              const selected = isSelected(day);
              const todayMark = isToday(day);
              const future = isFuture(day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={future}
                  onClick={() => handleDateSelect(day)}
                  className={`
                    flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors
                    ${future ? 'text-ink-faint/30 cursor-not-allowed' : selected ? 'bg-volt text-court font-bold' : 'text-ink hover:bg-court-surface'}
                    ${todayMark && !selected && !future ? 'border border-volt text-volt font-medium' : ''}
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
