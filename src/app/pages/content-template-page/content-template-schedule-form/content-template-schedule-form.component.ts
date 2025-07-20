import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { FormsModule } from '@angular/forms';
import { components } from '../../../generated/models';

// Extend slot type to include _selectedTime
interface ScheduleSlot {
  hour: number;
  minute: number;
  timezone: string;
  _selectedTime: { hour: number; minute: number };
}

@Component({
  selector: 'app-content-template-schedule-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule],
  templateUrl: './content-template-schedule-form.component.html',
  styleUrls: ['./content-template-schedule-form.component.scss']
})
export class ContentTemplateScheduleFormComponent {
  @Input() schedule: components["schemas"]["Schedule"] | undefined;
  @Output() scheduleChange = new EventEmitter<components["schemas"]["Schedule"]>();

  daysOfWeekOptions: Array<"monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"> = [
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
  ];

  // Array of all half-hour slots in a 24-hour period
  timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? 0 : 30;
    const label = `${hour.toString().padStart(2, '0')}:${minute === 0 ? '00' : '30'}`;
    return { value: { hour, minute }, label };
  });

  // Common timezone options
  timezoneOptions = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Hong_Kong', 'Australia/Sydney'
  ];

  // Helper to ensure _selectedTime is present on a slot
  private ensureSelectedTime(slot: any): ScheduleSlot {
    slot._selectedTime = { hour: slot.hour, minute: slot.minute };
    return slot as ScheduleSlot;
  }

  ngOnInit() {
    // Only initialize schedule if truly undefined
    if (!this.schedule) {
      this.schedule = {
        daysOfWeek: [],
        timeSlots: []
      } as components["schemas"]["Schedule"];
    }
    // Initialize _selectedTime for each slot if present
    if (this.schedule && this.schedule.timeSlots) {
      this.schedule.timeSlots = this.schedule.timeSlots.map(slot => this.ensureSelectedTime(slot));
    }
  }

  onTimeSlotTimeChange(index: number, value: { hour: number, minute: number }) {
    if (!this.schedule) return;
    const timeSlots = [...(this.schedule.timeSlots || [])] as ScheduleSlot[];
    timeSlots[index].hour = value.hour;
    timeSlots[index].minute = value.minute;
    timeSlots[index] = this.ensureSelectedTime(timeSlots[index]);
    this.schedule = { ...this.schedule, timeSlots };
    this.scheduleChange.emit(this.schedule);
  }

  removeTimeSlot(index: number) {
    if (!this.schedule || !this.schedule.timeSlots) return;
    this.schedule.timeSlots.splice(index, 1);
    this.scheduleChange.emit(this.schedule);
  }

  onDaysOfWeekChange(days: string[]) {
    if (!this.schedule) return;
    this.schedule = { ...this.schedule, daysOfWeek: days as ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[] };
    this.scheduleChange.emit(this.schedule);
  }

  onDaysOfWeekChangeCheckbox(day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday", checked: boolean) {
    if (!this.schedule) return;
    const days = new Set(this.schedule.daysOfWeek || []);
    if (checked) {
      days.add(day);
    } else {
      days.delete(day);
    }
    this.schedule = { ...this.schedule, daysOfWeek: Array.from(days) as ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[] };
    this.scheduleChange.emit(this.schedule);
  }

  onTimeSlotChange(index: number, slot: components["schemas"]["TimeSlot"]) {
    if (!this.schedule) return;
    const timeSlots = [...(this.schedule.timeSlots || [])] as ScheduleSlot[];
    timeSlots[index] = this.ensureSelectedTime(slot);
    this.schedule = { ...this.schedule, timeSlots };
    this.scheduleChange.emit(this.schedule);
  }

  getSlotTime(slot: ScheduleSlot): { hour: number; minute: number } {
    return { hour: slot.hour, minute: slot.minute };
  }

  ngAfterViewInit() {
    if (this.schedule && this.schedule.timeSlots) {
      this.schedule.timeSlots = this.schedule.timeSlots.map(slot => this.ensureSelectedTime(slot));
    }
  }

  addTimeSlot() {
    if (!this.schedule) return;
    const newSlot: ScheduleSlot = {
      hour: 0,
      minute: 0,
      timezone: this.timezoneOptions[0],
      _selectedTime: { hour: 0, minute: 0 }
    };
    this.schedule.timeSlots = [...(this.schedule.timeSlots || []), newSlot];
    this.scheduleChange.emit(this.schedule);
  }
}
