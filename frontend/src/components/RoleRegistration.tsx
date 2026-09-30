import { HeartIcon, PinIcon } from './icons';

interface RoleRegistrationProps {
  onSelect: (role: 'volunteer' | 'applicant') => void;
}

export default function RoleRegistration({ onSelect }: RoleRegistrationProps) {
  return (
    <main className="role-registration">
      <div className="role-registration__brand" aria-hidden="true">
        <HeartIcon width={30} height={30} />
      </div>
      <span className="role-registration__eyebrow">ПОМОЩЬ РЯДОМ</span>
      <h1>Добрые дела начинаются рядом</h1>
      <p className="role-registration__intro">Выберите, как хотите пользоваться приложением.</p>

      <div className="role-registration__choices">
        <button type="button" className="role-choice role-choice--volunteer" onClick={() => onSelect('volunteer')}>
          <span className="role-choice__icon"><HeartIcon width={28} height={28} /></span>
          <span className="role-choice__copy">
            <b>Я могу помочь</b>
            <span>Найду просьбы рядом и помогу людям</span>
          </span>
          <span className="role-choice__arrow" aria-hidden="true">›</span>
        </button>
        <button type="button" className="role-choice role-choice--applicant" onClick={() => onSelect('applicant')}>
          <span className="role-choice__icon"><PinIcon width={28} height={28} /></span>
          <span className="role-choice__copy">
            <b>Мне нужна помощь</b>
            <span>Опишу просьбу и найду помощника</span>
          </span>
          <span className="role-choice__arrow" aria-hidden="true">›</span>
        </button>
      </div>

      <p className="role-registration__foot">Профиль можно сменить позже: откройте «Профиль» и нажмите кнопку внизу экрана.</p>
    </main>
  );
}
