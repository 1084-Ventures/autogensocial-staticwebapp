import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../material.module';
import { FormsModule } from '@angular/forms';
import { components } from '../../../generated/models';

@Component({
  selector: 'app-content-template-schedule-form',
  standalone: true,
  imports: [CommonModule, MaterialModule, FormsModule],
  templateUrl: './content-template-schedule-form.component.html',
  styleUrls: ['./content-template-schedule-form.component.scss']
})
export class ContentTemplateScheduleFormComponent {
  ngOnInit() {
    // Ensure schedule is always initialized with required structure
    if (!this.schedule) {
      this.schedule = {
        daysOfWeek: [],
        timeSlots: []
      } as components["schemas"]["Schedule"];
      this.scheduleChange.emit(this.schedule);
    } else {
      // Ensure daysOfWeek exists
      if (!this.schedule.daysOfWeek) {
        this.schedule.daysOfWeek = [];
        this.scheduleChange.emit(this.schedule);
      }
      // Ensure timeSlots exists
      if (!this.schedule.timeSlots) {
        this.schedule.timeSlots = [];
        this.scheduleChange.emit(this.schedule);
      }
    }
  }
  @Input() schedule: components["schemas"]["Schedule"] | undefined;
  @Output() scheduleChange = new EventEmitter<components["schemas"]["Schedule"]>();

  daysOfWeekOptions = [
    "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
  ];

  addTimeSlot() {
    if (!this.schedule) return;
    const newSlot: components["schemas"]["TimeSlot"] = { hour: 9, minute: 0, timezone: 'UTC' };
    this.schedule = {
      ...this.schedule,
      timeSlots: [...(this.schedule.timeSlots || []), newSlot]
    };
    this.scheduleChange.emit(this.schedule);
  }

  removeTimeSlot(index: number) {
    if (!this.schedule) return;
    const timeSlots = [...(this.schedule.timeSlots || [])];
    timeSlots.splice(index, 1);
    this.schedule = { ...this.schedule, timeSlots };
    this.scheduleChange.emit(this.schedule);
  }

  onDaysOfWeekChange(days: string[]) {
    if (!this.schedule) return;
    this.schedule = { ...this.schedule, daysOfWeek: days as ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[] };
    this.scheduleChange.emit(this.schedule);
  }

  onTimeSlotChange(index: number, slot: components["schemas"]["TimeSlot"]) {
    if (!this.schedule) return;
    const timeSlots = [...(this.schedule.timeSlots || [])];
    timeSlots[index] = slot;
    this.schedule = { ...this.schedule, timeSlots };
    this.scheduleChange.emit(this.schedule);
  }
}
