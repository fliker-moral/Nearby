import { CATEGORY_META } from '../config';
import type { Task } from '../types';

/**
 * DOM-элемент метки задачи. Цвет — по категории, форма «каплей» как в макете.
 * Свободные задачи (PUBLISHED) пульсируют, взятые/выполненные — приглушены.
 */
export function createTaskMarkerEl(task: Task): HTMLElement {
  const meta = CATEGORY_META[task.category];
  const el = document.createElement('button');
  el.className = 'task-marker';
  el.type = 'button';
  el.setAttribute('aria-label', task.title);
  el.dataset.status = task.status;
  el.style.setProperty('--marker-color', meta.color);

  const available = task.status === 'PUBLISHED';
  el.innerHTML = `
    ${available ? '<span class="task-marker__pulse"></span>' : ''}
    <span class="task-marker__pin">
      <span class="task-marker__glyph">${meta.emoji}</span>
    </span>
  `;
  if (!available) el.classList.add('task-marker--muted');
  return el;
}

/** Обновить внешний вид существующей метки при смене статуса. */
export function updateTaskMarkerEl(el: HTMLElement, task: Task): void {
  el.dataset.status = task.status;
  const available = task.status === 'PUBLISHED';
  el.classList.toggle('task-marker--muted', !available);
  const pulse = el.querySelector('.task-marker__pulse');
  if (available && !pulse) {
    el.insertAdjacentHTML('afterbegin', '<span class="task-marker__pulse"></span>');
  } else if (!available && pulse) {
    pulse.remove();
  }
}
