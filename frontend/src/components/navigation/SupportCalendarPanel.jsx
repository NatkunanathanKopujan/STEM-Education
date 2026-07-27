import { useEffect, useMemo, useState } from 'react';
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiHelpCircle, FiMail, FiPhone, FiTrash2 } from 'react-icons/fi';
import { calendarNoteService } from '../../services/calendarNoteService';
import { settingsService } from '../../services/settingsService';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const poyaNames = [
  'Duruthu Full Moon Poya',
  'Navam Full Moon Poya',
  'Medin Full Moon Poya',
  'Bak Full Moon Poya',
  'Vesak Full Moon Poya',
  'Poson Full Moon Poya',
  'Esala Full Moon Poya',
  'Nikini Full Moon Poya',
  'Binara Full Moon Poya',
  'Vap Full Moon Poya',
  'Il Full Moon Poya',
  'Unduvap Full Moon Poya',
];
const fixedSriLankanSpecialDays = [
  { month: 0, day: 1, title: 'New Year Day', details: 'First day of the calendar year.' },
  { month: 0, day: 14, title: 'Thai Pongal', details: 'Tamil harvest festival celebrated in Sri Lanka.' },
  { month: 1, day: 4, title: 'Independence Day', details: 'Sri Lanka National Day.' },
  { month: 3, day: 13, title: 'Sinhala and Tamil New Year Eve', details: 'Traditional new year period begins.' },
  { month: 3, day: 14, title: 'Sinhala and Tamil New Year', details: 'Aluth Avurudda and Puthandu celebrations.' },
  { month: 4, day: 1, title: 'May Day', details: 'International workers day.' },
  { month: 11, day: 25, title: 'Christmas Day', details: 'Christmas public holiday.' },
];
const knownFullMoonUtc = Date.UTC(2000, 0, 21, 4, 40);
const synodicMonthDays = 29.530588853;

function buildCalendarDays(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const days = Array.from({ length: startOffset }, () => null);

  for (let day = 1; day <= lastDate; day += 1) {
    days.push(day);
  }

  return days;
}

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getApproxFullMoonDay(year, month) {
  const middleOfMonth = Date.UTC(year, month, 15, 12);
  const cycle = Math.round((middleOfMonth - knownFullMoonUtc) / (synodicMonthDays * 86400000));
  const fullMoon = new Date(knownFullMoonUtc + cycle * synodicMonthDays * 86400000);
  return fullMoon.getUTCFullYear() === year && fullMoon.getUTCMonth() === month
    ? fullMoon.getUTCDate()
    : null;
}

function getSriLankanSpecialDays(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const specialDays = new Map();

  fixedSriLankanSpecialDays
    .filter((item) => item.month === month)
    .forEach((item) => {
      specialDays.set(dateKey(year, month, item.day), {
        day: item.day,
        title: item.title,
        details: item.details,
      });
    });

  const poyaDay = getApproxFullMoonDay(year, month);
  if (poyaDay) {
    specialDays.set(dateKey(year, month, poyaDay), {
      day: poyaDay,
      title: poyaNames[month],
      details:
        month === 4
          ? 'Vesak Poya: commemorates the birth, enlightenment, and passing away of Lord Buddha.'
          : 'Monthly full moon Poya day observed in Sri Lanka.',
    });
  }

  return specialDays;
}

function isToday(viewDate, day) {
  const today = new Date();
  return (
    day &&
    today.getFullYear() === viewDate.getFullYear() &&
    today.getMonth() === viewDate.getMonth() &&
    today.getDate() === day
  );
}

function currentDateKey() {
  const today = new Date();
  return dateKey(today.getFullYear(), today.getMonth(), today.getDate());
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function SupportCalendarPanel() {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [support, setSupport] = useState({ email: '', phone: '' });
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSpecialDay, setSelectedSpecialDay] = useState(null);
  const [selectedDateKey, setSelectedDateKey] = useState(() => currentDateKey());
  const [notes, setNotes] = useState({});
  const [noteDraft, setNoteDraft] = useState('');
  const [noteStatus, setNoteStatus] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    let active = true;
    const handleSupportChange = (event) => {
      if (active) setSupport(event.detail || { email: '', phone: '' });
    };

    window.addEventListener('support-settings-changed', handleSupportChange);

    settingsService
      .publicSupport()
      .then((data) => {
        if (active) setSupport(data || { email: '', phone: '' });
      })
      .catch(() => {
        if (active) setSupport({ email: '', phone: '' });
      });

    return () => {
      active = false;
      window.removeEventListener('support-settings-changed', handleSupportChange);
    };
  }, []);

  useEffect(() => {
    let active = true;

    calendarNoteService
      .list({ month: monthKey(viewDate) })
      .then((data) => {
        if (!active) return;
        const monthNotes = Object.fromEntries((data.notes || []).map((item) => [item.noteDate, item.note]));
        setNotes((current) => ({ ...current, ...monthNotes }));
      })
      .catch(() => {
        if (active) setNoteStatus('Unable to load saved calendar notes.');
      });

    return () => {
      active = false;
    };
  }, [viewDate]);

  useEffect(() => {
    if (selectedDateKey) {
      setNoteDraft(notes[selectedDateKey] || '');
    }
  }, [notes, selectedDateKey]);

  const days = useMemo(() => buildCalendarDays(viewDate), [viewDate]);
  const specialDays = useMemo(() => getSriLankanSpecialDays(viewDate), [viewDate]);
  const monthLabel = useMemo(
    () => viewDate.toLocaleString(undefined, { month: 'long', year: 'numeric' }),
    [viewDate],
  );

  const moveMonth = (direction) => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
    setSelectedSpecialDay(null);
    setSelectedDateKey(null);
    setNoteStatus('');
  };

  const selectDate = (day, specialDay) => {
    const key = dateKey(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSelectedDateKey(key);
    setSelectedSpecialDay(specialDay || null);
    setNoteDraft(notes[key] || '');
    setNoteStatus('');
  };

  const saveNote = async () => {
    if (!selectedDateKey) return;
    const trimmedNote = noteDraft.trim();
    if (!trimmedNote) {
      setNoteStatus('Type a note before saving.');
      return;
    }

    setIsSavingNote(true);
    setNoteStatus('');
    try {
      const saved = await calendarNoteService.save(selectedDateKey, trimmedNote);
      setNotes((current) => ({ ...current, [saved.noteDate]: saved.note }));
      setNoteStatus('Note saved for this date.');
    } catch (error) {
      setNoteStatus(error.response?.data?.message || 'Unable to save note.');
    } finally {
      setIsSavingNote(false);
    }
  };

  const clearNote = async () => {
    if (!selectedDateKey) return;

    setIsSavingNote(true);
    setNoteStatus('');
    try {
      await calendarNoteService.remove(selectedDateKey);
      setNotes((current) => {
        const next = { ...current };
        delete next[selectedDateKey];
        return next;
      });
      setNoteDraft('');
      setNoteStatus('Note removed from this date.');
    } catch (error) {
      setNoteStatus(error.response?.data?.message || 'Unable to remove note.');
    } finally {
      setIsSavingNote(false);
    }
  };

  const hasTodayNote = Boolean(notes[currentDateKey()]);

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {isOpen ? (
        <section className="max-h-[75vh] w-[min(calc(100vw-2.5rem),46rem)] overflow-y-auto rounded-2xl border border-[#3d505d] bg-[#263541] text-[#eef8f2] shadow-[0_24px_70px_rgba(15,23,42,0.36)]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Support Center</p>
              <p className="text-sm font-semibold text-[#d9e8e2]">Need help or check dates</p>
            </div>
            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/10 p-2 text-white transition hover:bg-white/20"
              aria-label="Hide support panel"
              onClick={() => setIsOpen(false)}
            >
              <FiChevronDown />
            </button>
          </div>
          <div className="grid gap-5 px-5 py-5 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div className="rounded-xl border border-white/10 bg-[#22303b] p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-[#bcd0c9]">Do you need any</p>
          <h2 className="mt-2 text-2xl font-bold tracking-normal text-white">Support ?</h2>
          <div className="mt-4 grid gap-3 text-sm font-semibold text-[#d9e8e2] md:grid-cols-2 lg:grid-cols-1">
            <p className="flex min-w-0 items-center gap-3">
              <FiMail className="size-4 shrink-0 text-primary" />
              {support.email ? (
                <a className="truncate text-primary hover:underline" href={`mailto:${support.email}`}>
                  {support.email}
                </a>
              ) : (
                <span className="truncate">Support email not configured</span>
              )}
            </p>
            <p className="flex min-w-0 items-center gap-3">
              <FiPhone className="size-4 shrink-0 text-primary" />
              {support.phone ? (
                <a className="truncate hover:underline" href={`tel:${support.phone}`}>
                  {support.phone}
                </a>
              ) : (
                <span className="truncate">Support phone not configured</span>
              )}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#22303b] p-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h2 className="border-b-2 border-primary pb-2 text-base font-bold text-white">Calendar</h2>
            <span className="text-xs font-semibold text-[#bcd0c9]">Today</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              className="rounded-full p-1.5 text-primary transition hover:bg-white/10"
              aria-label="Previous month"
              onClick={() => moveMonth(-1)}
            >
              <FiChevronLeft />
            </button>
            <p className="text-sm font-bold text-white">{monthLabel}</p>
            <button
              type="button"
              className="rounded-full p-1.5 text-primary transition hover:bg-white/10"
              aria-label="Next month"
              onClick={() => moveMonth(1)}
            >
              <FiChevronRight />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">
            {weekDays.map((day) => (
              <span key={day} className="font-bold text-[#c8ded6]">
                {day}
              </span>
            ))}
            {days.map((day, index) => {
              const specialDay = day ? specialDays.get(dateKey(viewDate.getFullYear(), viewDate.getMonth(), day)) : null;
              return (
              <button
                type="button"
                key={`${day || 'empty'}-${index}`}
                disabled={!day}
                onClick={() => selectDate(day, specialDay)}
                className={`relative flex aspect-square items-center justify-center rounded-full text-xs font-semibold transition ${
                  isToday(viewDate, day)
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : selectedDateKey === dateKey(viewDate.getFullYear(), viewDate.getMonth(), day)
                      ? 'bg-white/15 text-white'
                    : day
                      ? 'text-[#d9e8e2] hover:bg-white/10'
                      : 'text-transparent'
                }`}
              >
                {day || 0}
                {day && notes[dateKey(viewDate.getFullYear(), viewDate.getMonth(), day)] ? (
                  <span className="absolute right-1 top-1 size-1.5 rounded-full bg-[#7dd3fc]" />
                ) : null}
                {specialDay ? (
                  <span className="absolute bottom-0.5 size-1.5 rounded-full bg-primary" />
                ) : null}
              </button>
              );
            })}
          </div>
          {selectedSpecialDay ? (
            <div className="mt-3 rounded-xl border border-primary/30 bg-white/10 p-3 text-left">
              <p className="text-sm font-bold text-white">{selectedSpecialDay.title}</p>
              <p className="mt-1 text-xs font-semibold text-[#c8ded6]">{selectedSpecialDay.details}</p>
            </div>
          ) : (
            <p className="mt-3 text-xs font-semibold text-[#bcd0c9]">
              Gold point means a Sri Lankan special day. Click the date to view details.
            </p>
          )}
          {selectedDateKey ? (
            <div className="mt-3 rounded-xl border border-white/10 bg-white/10 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-white">Note for {selectedDateKey}</p>
                {notes[selectedDateKey] ? (
                  <span className="rounded-full bg-[#7dd3fc]/20 px-2 py-0.5 text-[0.68rem] font-bold uppercase text-[#bae6fd]">
                    Saved
                  </span>
                ) : null}
              </div>
              <textarea
                className="mt-2 min-h-24 w-full resize-y rounded-xl border border-white/10 bg-[#1b2731] px-3 py-2 text-sm font-semibold text-white outline-none transition placeholder:text-[#9fb3ad] focus:border-primary"
                maxLength={1000}
                placeholder="Type note for this date"
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSavingNote}
                  onClick={saveNote}
                >
                  {isSavingNote ? 'Saving...' : 'Save Note'}
                </button>
                {notes[selectedDateKey] ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSavingNote}
                    onClick={clearNote}
                  >
                    <FiTrash2 /> Clear
                  </button>
                ) : null}
              </div>
              {noteStatus ? <p className="mt-2 text-xs font-semibold text-[#c8ded6]">{noteStatus}</p> : null}
            </div>
          ) : null}
        </div>
          </div>
        </section>
      ) : null}
      <button
        type="button"
        className="relative flex size-14 items-center justify-center rounded-full border border-[#3d505d] bg-[#263541] text-primary shadow-[0_16px_36px_rgba(15,23,42,0.28)] transition hover:-translate-y-0.5 hover:bg-[#22303b]"
        aria-label={isOpen ? 'Hide support calendar' : 'Show support calendar'}
        onClick={() => setIsOpen((current) => !current)}
      >
        {hasTodayNote ? (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-[0.65rem] font-black text-white ring-2 ring-[#263541]">
            !
          </span>
        ) : null}
        <FiHelpCircle className="size-6" />
      </button>
    </div>
  );
}
