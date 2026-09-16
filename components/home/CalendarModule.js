"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useCurrentUser } from "../../lib/currentUserContext";
import HomeModuleCard from "./HomeModuleCard";
import { getCalendarGrid, toDateKey, parseDateKey, formatTime } from "../../lib/homeCalendar";
import { fetchEventsInRange, createEvent, updateEvent, deleteEvent } from "../../lib/homeEvents";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function emptyForm(dateKey) {
  return {
    title: "",
    event_date: dateKey,
    start_time: "",
    end_time: "",
    description: "",
  };
}

export default function CalendarModule() {
  const { person } = useCurrentUser();
  const today = useMemo(() => new Date(), []);
  const todayKey = toDateKey(today);

  // year/month are a single piece of state (not two) so rapid prev/next
  // clicks always compose correctly via the functional setState form —
  // two separate setters each reading the same stale closure would let a
  // fast double-click under-advance by a month.
  const [viewDate, setViewDate] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const { year: viewYear, month: viewMonth } = viewDate;
  const [events, setEvents] = useState([]);
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [formData, setFormData] = useState(emptyForm(todayKey));
  const [error, setError] = useState("");

  const grid = useMemo(() => getCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  useEffect(() => {
    let cancelled = false;
    const startKey = toDateKey(grid[0].date);
    const endKey = toDateKey(grid[grid.length - 1].date);

    fetchEventsInRange(supabase, startKey, endKey).then((rows) => {
      if (!cancelled) setEvents(rows);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewYear, viewMonth]);

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      if (!map[ev.event_date]) map[ev.event_date] = [];
      map[ev.event_date].push(ev);
    });
    return map;
  }, [events]);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function goToPrevMonth() {
    setViewDate((prev) => {
      const d = new Date(prev.year, prev.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function goToNextMonth() {
    setViewDate((prev) => {
      const d = new Date(prev.year, prev.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function openAddForm() {
    setError("");
    setEditingEvent(null);
    setFormData(emptyForm(selectedKey));
    setFormOpen(true);
  }

  function openEditForm(ev) {
    setError("");
    setViewingEvent(null);
    setEditingEvent(ev);
    setFormData({
      title: ev.title,
      event_date: ev.event_date,
      start_time: ev.start_time ? ev.start_time.slice(0, 5) : "",
      end_time: ev.end_time ? ev.end_time.slice(0, 5) : "",
      description: ev.description || "",
    });
    setFormOpen(true);
  }

  async function handleSave() {
    if (!formData.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!person) {
      setError("Your account isn't set up for calendar changes yet.");
      return;
    }

    const payload = {
      title: formData.title.trim(),
      event_date: formData.event_date,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      description: formData.description.trim() || null,
    };

    if (editingEvent) {
      setEvents((prev) =>
        prev.map((e) => (e.id === editingEvent.id ? { ...e, ...payload } : e))
      );
      await updateEvent(supabase, editingEvent.id, payload);
    } else {
      const created = await createEvent(supabase, payload, person);
      if (created) setEvents((prev) => [...prev, created]);
    }

    setFormOpen(false);
  }

  async function handleDelete(ev) {
    setEvents((prev) => prev.filter((e) => e.id !== ev.id));
    setViewingEvent(null);
    await deleteEvent(supabase, ev.id);
  }

  const selectedEvents = eventsByDate[selectedKey] || [];

  return (
    <HomeModuleCard title="CALENDAR" icon="🗓️" className="calendar-card">
      <div className="calendar-header">
        <button
          type="button"
          className="calendar-nav-button"
          onClick={goToPrevMonth}
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="calendar-month-label">{monthLabel}</span>
        <button
          type="button"
          className="calendar-nav-button"
          onClick={goToNextMonth}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="calendar-weekdays">
        {WEEKDAY_LABELS.map((w, i) => (
          <span key={i} className="calendar-weekday">
            {w}
          </span>
        ))}
      </div>

      <div className="calendar-grid">
        {grid.map(({ date, inMonth }) => {
          const key = toDateKey(date);
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;
          const hasEvents = Boolean(eventsByDate[key]);

          return (
            <button
              type="button"
              key={key}
              className={[
                "calendar-day",
                !inMonth && "calendar-day-outside",
                isToday && "calendar-day-today",
                isSelected && "calendar-day-selected",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setSelectedKey(key)}
            >
              {date.getDate()}
              {hasEvents && <span className="calendar-day-dot" />}
            </button>
          );
        })}
      </div>

      <div className="calendar-selected-day">
        <div className="calendar-selected-day-header">
          <span>
            {parseDateKey(selectedKey).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </span>
          <button type="button" className="calendar-add-button" onClick={openAddForm}>
            + Event
          </button>
        </div>

        {selectedEvents.length === 0 ? (
          <p className="home-placeholder-text">No events.</p>
        ) : (
          <div className="calendar-event-list">
            {selectedEvents.map((ev) => (
              <button
                type="button"
                key={ev.id}
                className="calendar-event-chip"
                onClick={() => setViewingEvent(ev)}
              >
                {ev.start_time && (
                  <span className="calendar-event-time">{formatTime(ev.start_time)}</span>
                )}
                <span className="calendar-event-title">{ev.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {viewingEvent && (
        <div className="detail-panel-overlay" onClick={() => setViewingEvent(null)}>
          <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
            <div className="detail-panel-header">
              <h2>{viewingEvent.title}</h2>
              <button
                className="detail-panel-close"
                onClick={() => setViewingEvent(null)}
              >
                ✕
              </button>
            </div>

            <div className="detail-panel-body">
              <div className="detail-row">
                <span className="detail-label">Date</span>
                <span className="detail-value">
                  {parseDateKey(viewingEvent.event_date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              {(viewingEvent.start_time || viewingEvent.end_time) && (
                <div className="detail-row">
                  <span className="detail-label">Time</span>
                  <span className="detail-value">
                    {viewingEvent.start_time ? formatTime(viewingEvent.start_time) : ""}
                    {viewingEvent.end_time ? ` – ${formatTime(viewingEvent.end_time)}` : ""}
                  </span>
                </div>
              )}

              {viewingEvent.description && (
                <div className="detail-row detail-row-notes">
                  <span className="detail-label">Description</span>
                  <span className="detail-value">{viewingEvent.description}</span>
                </div>
              )}

              <div className="detail-row">
                <span className="detail-label">Created by</span>
                <span className="detail-value">{viewingEvent.created_by} wrote</span>
              </div>

              <div className="detail-divider" />

              <button
                type="button"
                className="inventory-add-button form-save-button"
                onClick={() => openEditForm(viewingEvent)}
              >
                Edit
              </button>
              <button
                type="button"
                className="delete-item-button"
                onClick={() => handleDelete(viewingEvent)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {formOpen && (
        <div className="detail-panel-overlay" onClick={() => setFormOpen(false)}>
          <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
            <div className="detail-panel-header">
              <h2>{editingEvent ? "Edit Event" : "Add Event"}</h2>
              <button className="detail-panel-close" onClick={() => setFormOpen(false)}>
                ✕
              </button>
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="detail-panel-body">
              <label className="form-field">
                <span className="detail-label">Title *</span>
                <input
                  className="form-input"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                />
              </label>

              <label className="form-field">
                <span className="detail-label">Date</span>
                <input
                  className="form-input"
                  type="date"
                  value={formData.event_date}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, event_date: e.target.value }))
                  }
                />
              </label>

              <label className="form-field">
                <span className="detail-label">Start Time</span>
                <input
                  className="form-input"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, start_time: e.target.value }))
                  }
                />
              </label>

              <label className="form-field">
                <span className="detail-label">End Time</span>
                <input
                  className="form-input"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData((f) => ({ ...f, end_time: e.target.value }))}
                />
              </label>

              <label className="form-field">
                <span className="detail-label">Description</span>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </label>

              <button
                type="button"
                className="inventory-add-button form-save-button"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </HomeModuleCard>
  );
}
