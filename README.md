# Den V Fokuse

Сделай одностраничное веб-приложение — ежедневный блокнот с целями и задачами на русском языке.

Функционал:

1. Верхняя панель календаря: отображение текущего месяца с кнопками перелистывания назад и вперёд, а также выбор любого конкретного дня месяца. При клике на день открываются цели и задачи именно на эту дату.

2. Два отдельных блока на выбранный день: «Главные цели» и «Задачи». В каждом блоке есть поле ввода текста, необязательное поле времени напоминания и кнопка «Добавить».

3. У каждой задачи есть 3 действия:

   - Переключатель «Выполнено» (задача зачёркивается и становится полупрозрачной).

   - Кнопка «Отложить»: открывает компактное окно, где можно указать, на сколько часов и минут перенести задачу (и быстрые кнопки: +15 мин, +1 час, +3 часа). После сохранения время задачи автоматически обновляется и отображается рядом с ней.

   - Кнопка удаления задачи.

4. Все цели и задачи автоматически сохраняются в памяти браузера (localStorage), чтобы не пропадали после перезагрузки страницы.

5. Если время задачи наступило, пока открыта вкладка, показывать аккуратное визуальное уведомление внутри приложения.

Дизайн:

Современный минимализм, тёмная тема (глубокий тёмно-серый фон, контрастные карточки), акцентный голубой цвет для кнопок и выбранной даты. Интерфейс полностью адаптирован под экран смартфона (удобно нажимать пальцем).

Ограничения:

Без регистрации, без создания аккаунта и без подключения внешней базы данных (только фронтенд и localStorage).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://den-v-fokuse.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/dfb286c6-9c88-42da-889d-ae93384726d9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
