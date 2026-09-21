import type { Task, TaskAuthor } from '../types';
import { DEFAULT_CENTER } from '../config';

// Демо-данные для работы фронтенда без запущенного бэкенда.
// Координаты разбросаны вокруг центра Москвы, чтобы метки попадали в кадр 3D-карты.

const [clon, clat] = DEFAULT_CENTER;

/** Небольшой сдвиг координаты от центра в «метрах на глаз». */
function near(dLatM: number, dLonM: number): [number, number] {
  return [clon + dLonM / 63000, clat + dLatM / 111000];
}

const authors: Record<string, TaskAuthor> = {
  nina: {
    id: 'a1',
    name: 'Нина Петровна',
    avatar_url: null,
    rating_score: 4.9,
    rating_count: 32,
  },
  boris: {
    id: 'a2',
    name: 'Борис Семёнович',
    avatar_url: null,
    rating_score: 4.7,
    rating_count: 18,
  },
  galina: {
    id: 'a3',
    name: 'Галина Ивановна',
    avatar_url: null,
    rating_score: 5.0,
    rating_count: 9,
  },
  center: {
    id: 'a4',
    name: 'Совет ветеранов р-на',
    avatar_url: null,
    rating_score: 4.8,
    rating_count: 54,
  },
  arkady: {
    id: 'a5',
    name: 'Аркадий Львович',
    avatar_url: null,
    rating_score: 4.6,
    rating_count: 12,
  },
};

export const MOCK_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Купить лекарства в аптеке',
    description:
      'Нужно забрать по рецепту препараты для сердца и померить давление. Рецепт и деньги отдам при встрече, аптека в соседнем доме.',
    category: 'PERSONAL_HELP',
    status: 'PUBLISHED',
    ...toLL(near(120, -90)),
    address_text: 'ул. Лесная, 15, кв. 12',
    photos: [],
    author: authors.nina,
    created_at: '2026-09-21T08:10:00Z',
    reward_points: 40,
    eta_minutes: 35,
  },
  {
    id: 't2',
    title: 'Погулять с собакой',
    description:
      'Такса Марта, очень спокойная. Прогулка 20–30 минут во дворе, поводок и пакетики дам. Тяжело наклоняться после операции.',
    category: 'PERSONAL_HELP',
    status: 'PUBLISHED',
    ...toLL(near(-80, 140)),
    address_text: 'ул. Центральная, 9',
    photos: [],
    author: authors.boris,
    created_at: '2026-09-21T09:00:00Z',
    reward_points: 30,
    eta_minutes: 30,
  },
  {
    id: 't3',
    title: 'Донести продукты из магазина',
    description:
      'Купить продукты по списку в «Пятёрочке» и донести до 4 этажа (лифта нет). Список в чате, сумма примерно 900 ₽.',
    category: 'PERSONAL_HELP',
    status: 'PUBLISHED',
    ...toLL(near(60, 40)),
    address_text: 'ул. Новая, 22, подъезд 2',
    photos: [],
    author: authors.galina,
    created_at: '2026-09-21T07:40:00Z',
    reward_points: 45,
    eta_minutes: 45,
  },
  {
    id: 't4',
    title: 'Помочь с оплатой ЖКХ на почте',
    description:
      'Нужно сходить на почту, оплатить квитанции и объяснить, как оплачивать через приложение. Квитанции готовы.',
    category: 'PERSONAL_HELP',
    status: 'IN_PROGRESS',
    ...toLL(near(-160, -40)),
    address_text: 'ул. Лесная, 8',
    photos: [],
    author: authors.arkady,
    created_at: '2026-09-20T15:20:00Z',
    reward_points: 35,
    eta_minutes: 40,
  },
  {
    id: 't5',
    title: 'Концерт ко Дню пожилого человека',
    description:
      'Совет ветеранов ищет волонтёров: встретить гостей, помочь рассадить, раздать программки и чай. 1 октября, 14:00.',
    category: 'EVENT_ORGANIZATION',
    status: 'PUBLISHED',
    ...toLL(near(200, 120)),
    address_text: 'ДК «Дружба», ул. Парковая, 3',
    photos: [],
    author: authors.center,
    created_at: '2026-09-19T12:00:00Z',
    reward_points: 80,
    eta_minutes: 180,
  },
  {
    id: 't6',
    title: 'Разобрать и вынести старую мебель',
    description:
      'Помочь разобрать шкаф и вынести к контейнеру для крупногабарита. Нужны 1–2 крепких волонтёра.',
    category: 'OTHER',
    status: 'PUBLISHED',
    ...toLL(near(-40, -180)),
    address_text: 'ул. Центральная, 17, кв. 3',
    photos: [],
    author: authors.boris,
    created_at: '2026-09-21T06:30:00Z',
    reward_points: 60,
    eta_minutes: 60,
  },
  {
    id: 't7',
    title: 'Настроить телефон и видеозвонки',
    description:
      'Показать, как звонить по видео внукам и пользоваться мессенджером. Телефон новый, всё есть.',
    category: 'PERSONAL_HELP',
    status: 'PUBLISHED',
    ...toLL(near(150, -160)),
    address_text: 'наб. реки Москвы, 4',
    photos: [],
    author: authors.nina,
    created_at: '2026-09-21T10:05:00Z',
    reward_points: 35,
    eta_minutes: 40,
  },
  {
    id: 't8',
    title: 'Помощь на субботнике у сквера',
    description:
      'Собрать листья и мусор в сквере, покрасить лавочки. Инвентарь выдаём. Приходите командой класса!',
    category: 'EVENT_ORGANIZATION',
    status: 'PUBLISHED',
    ...toLL(near(-210, 60)),
    address_text: 'Сквер у ул. Центральной',
    photos: [],
    author: authors.center,
    created_at: '2026-09-20T09:15:00Z',
    reward_points: 70,
    eta_minutes: 120,
  },
  {
    id: 't9',
    title: 'Забрать заказ и отнести в ремонт часы',
    description:
      'Отнести наручные часы в мастерскую и забрать готовый заказ в пункте выдачи рядом.',
    category: 'OTHER',
    status: 'COMPLETED',
    ...toLL(near(30, 200)),
    address_text: 'ул. Новая, 5',
    photos: [],
    author: authors.arkady,
    created_at: '2026-09-18T11:00:00Z',
    reward_points: 25,
    eta_minutes: 30,
  },
  {
    id: 't10',
    title: 'Проводить в поликлинику',
    description:
      'Сопроводить до поликлиники и обратно, помочь взять талон в электронной очереди. Идти недалеко, но одной тяжело.',
    category: 'PERSONAL_HELP',
    status: 'PUBLISHED',
    ...toLL(near(-120, 190)),
    address_text: 'ул. Лесная, 22, кв. 41',
    photos: [],
    author: authors.galina,
    created_at: '2026-09-21T08:50:00Z',
    reward_points: 50,
    eta_minutes: 90,
  },
];

function toLL([lon, lat]: [number, number]): { lon: number; lat: number } {
  return { lon, lat };
}
