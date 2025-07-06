import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../material.module';
import type { components } from '../../../../generated/models';

@Component({
  selector: 'app-schedule-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  template: `
    <section class="form-section">
      <h3 mat-subheader>Schedule</h3>
      <!-- Days of week checkboxes -->
      <div class="days-row">
        <label *ngFor="let day of daysOfWeek">
          <input type="checkbox" [checked]="schedule.daysOfWeek.includes(day)" (change)="toggleDay(day, $any($event.target).checked)"> {{ day | titlecase }}
        </label>
      </div>
      <!-- Time slots (simple text for now) -->
      <div class="time-slots-row">
        <label>Time Slots (HH:MM, comma separated):</label>
        <input type="text" [(ngModel)]="timeSlotsString" (ngModelChange)="onTimeSlotsChange()">
      </div>
    </section>
  `
})
export class ScheduleEditorComponent {
  @Input() schedule!: components["schemas"]["Schedule"];
  @Output() scheduleChange = new EventEmitter<components["schemas"]["Schedule"]>();

  daysOfWeek: Array<'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday'> = [
    'monday','tuesday','wednesday','thursday','friday','saturday','sunday'
  ];

  get timeSlotsString(): string {
    return (this.schedule.timeSlots || []).map(ts => `${ts.hour.toString().padStart(2,'0')}:${ts.minute.toString().padStart(2,'0')}`).join(', ');
  }
  set timeSlotsString(val: string) {
    // no-op, handled in onTimeSlotsChange
  }

  toggleDay(day: 'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday', checked: boolean) {
    const days = new Set(this.schedule.daysOfWeek || []);
    if (checked) days.add(day); else days.delete(day);
    this.schedule.daysOfWeek = Array.from(days) as Array<'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday'>;
    this.scheduleChange.emit(this.schedule);
  }

  onTimeSlotsChange() {
    const slots = (this.timeSlotsString || '').split(',').map(s => s.trim()).filter(Boolean);
    this.schedule.timeSlots = slots.map(str => {
      const [hour, minute] = str.split(':').map(Number);
      return { hour, minute, timezone: 'UTC' };
    });
    this.scheduleChange.emit(this.schedule);
  }
}
