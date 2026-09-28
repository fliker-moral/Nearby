import type { MyRequest, Volunteer } from './types';

/** Пул волонтёров, которые «откликаются» на просьбы (для demo). */
export const VOLUNTEERS: Volunteer[] = [
  {
    id: 'v1',
    name: 'Алексей',
    age: 22,
    verified: true,
    rating_score: 5.0,
    rating_count: 27,
    done_count: 34,
    distance_km: 1.1,
    detail: 'Студент МГТУ им. Баумана',
    message: 'Здравствуйте! Готов помочь. Могу подойти сегодня во второй половине дня.',
  },
  {
    id: 'v2',
    name: 'Мария',
    age: 19,
    verified: true,
    rating_score: 4.9,
    rating_count: 15,
    done_count: 21,
    distance_km: 0.7,
    detail: 'Волонтёр с 2025 года',
    message: 'Добрый день! С радостью помогу, живу совсем рядом.',
  },
  {
    id: 'v3',
    name: 'Игорь',
    age: 24,
    verified: true,
    rating_score: 4.8,
    rating_count: 40,
    done_count: 52,
    distance_km: 1.6,
    detail: 'Помогает людям с 2024 года',
    message: 'Здравствуйте! Могу помочь сегодня вечером, всё сделаю аккуратно.',
  },
];

/** Начальные просьбы заявителя для demo (одна уже с откликом волонтёра). */
export const INITIAL_REQUESTS: MyRequest[] = [
  {
    id: 'r1',
    kind: 'meds',
    title: 'Купить лекарства',
    description:
      'Нужно купить лекарства по списку в аптеке и принести домой. Рецепт и деньги отдам при встрече.',
    address: 'ул. Ленина, 15, кв. 12',
    when: 'Сегодня, до 18:00',
    createdAt: new Date().toISOString(),
    status: 'offer',
    volunteer: VOLUNTEERS[0],
  },
  {
    id: 'r2',
    kind: 'groceries',
    title: 'Донести продукты',
    description: 'Помочь донести сумки с продуктами до 4 этажа, лифта нет.',
    address: 'ул. Ленина, 15, кв. 12',
    when: 'Завтра, утром',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'searching',
  },
];
