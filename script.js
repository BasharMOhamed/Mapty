'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

/// Workout Class
class Workout {
  id = `${Date.now()}`.slice(-10);
  date = new Date();

  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }
}

// Workout Children

class Running extends Workout {
  type = 'running';
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.calcSpeed();
  }

  calcSpeed() {
    // KM/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

/// The Application class
class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
  }

  // get Your position on the map
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Can't get your location");
        }
      );
    }
  }

  // Load the map in the div
  _loadMap(position) {
    this._getLocalStorage();

    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 15);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
    document
      .querySelector('.workouts')
      .addEventListener('click', this._moveToWorkoutLocation.bind(this));

    this.#workouts.forEach(workout => {
      this._renderWorkoutMark(workout);
    });
  }

  // Show the input form
  _showForm(mapE) {
    inputDistance.focus();
    form.classList.remove('hidden');
    this.#mapEvent = mapE;
  }

  // Show & hide candence and elevation
  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  // Add New Workout
  _newWorkout(e) {
    e.preventDefault();
    // const date = new Date();
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const cadence = +inputCadence.value;
    const elevation = +inputElevation.value;
    const type = inputType.value === 'running' ? 'running' : 'cycling';
    const { lat, lng } = this.#mapEvent.latlng;
    const isValid = (...input) => input.every(inp => Number.isFinite(inp));
    const isPositive = (...input) => input.every(inp => inp > 0);
    let workout;

    // if it's running
    if (type === 'running') {
      if (
        !isValid(distance, duration, cadence) ||
        !isPositive(distance, duration, cadence)
      ) {
        return alert('The inputs must be positive numbers!!!');
      }
      workout = new Running(distance, duration, [lat, lng], cadence);
    }

    // if it's cycling
    if (type === 'cycling') {
      if (
        !isValid(distance, duration, elevation) ||
        !isPositive(distance, duration, elevation)
      ) {
        return alert('The inputs must be positive numbers!!!');
      }
      workout = new Cycling(distance, duration, [lat, lng], elevation);
    }

    // add the workout to the array
    this.#workouts.push(workout);

    // render the mark on the map
    this._renderWorkoutMark(workout);

    // render workout in list
    this._renderWorkoutInList(workout);

    // Set the localStorage
    this._setLocalStorage();
    // hide the form and clear the inputs
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        '';
    form.classList.add('hidden');
  }

  // Render the Workout Mark on the map
  _renderWorkoutMark(workout) {
    const icon = workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️';
    const date = new Date(workout.date);
    const description = `${icon} ${workout.type[0].toUpperCase()}${workout.type.slice(
      1
    )} on ${months[date.getMonth()]} ${date.getDate()}`;
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${description}`)
      .openPopup();
  }

  // Render the workout in the list
  _renderWorkoutInList(workout) {
    const icon = workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️';
    const date = new Date(workout.date);
    const description = `${icon} ${workout.type[0].toUpperCase()}${workout.type.slice(
      1
    )} on ${months[date.getMonth()]} ${date.getDate()}`;
    let html = `<li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${icon}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === 'running') {
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
    }

    if (workout.type === 'cycling') {
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  // Go to the clicked Workout on the map
  _moveToWorkoutLocation(e) {
    if (e.target.closest('.workout')) {
      // Get the workout from the array
      const id = e.target.closest('.workout').dataset.id;
      const workout = this.#workouts.find(work => work.id === id);

      this.#map.setView(workout.coords, 17, {
        animate: true,
        pan: {
          duration: 2,
        },
      });
    }
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    this.#workouts = JSON.parse(localStorage.getItem('workouts'));

    this.#workouts.forEach(workout => {
      this._renderWorkoutInList(workout);
    });
  }
}

const app = new App();
