;(function () {
  const ui = {
    moves: document.querySelector('#moves'),
    time: document.querySelector('#time'),
    pairs: document.querySelector('#pairs'),
    pairsSelect: document.querySelector('#pairsSelect'),
    volume: document.querySelector('#volume'),
    volumeValue: document.querySelector('#volumeValue'),
    restartButton: document.querySelector('#restartBtn'),
    grid: document.querySelector('#grid'),
    overlay: document.querySelector('#overlay'),
    winText: document.querySelector('#winText'),
    playAgainButton: document.querySelector('#playAgainBtn'),
    closeButton: document.querySelector('#closeBtn'),
  }

  const icons = [
    '👹',
    '👺',
    '🤡',
    '👻',
    '💩',
    '👽',
    '☠️',
    '👾',
    '🤖',
    '🎃',
    '😸',
    '🚑',
    '🧭',
    '🚒',
    '🚕',
    '🚜',
    '🎁',
    '💎',
    '💣',
    '💵',
    '⏰',
    '✂️',
    '♠️',
    '♣️',
    '♥️',
    '♦️',
    '🍺',
    '🧀',
    '🌶',
    '🍅',
    '🍏',
    '🍌',
    '⚽️',
    '🎲',
    '🍣',
  ]

  const sound = {
    context: null,
    masterGain: null,
    enabled: true,
    volume: 0.3,

    init: function () {
      if (!this.enabled) return

      this.context = new (window.AudioContext || window.webkitAudioContext)()
      this.masterGain = this.context.createGain()
      this.masterGain.connect(this.context.destination)
      this.bindVolumeControls()

      let unlock = function () {
        if (sound.context && sound.context.state === 'suspended') {
          sound.context.resume()
        }
        document.removeEventListener('pointerdown', unlock)
        document.removeEventListener('keydown', unlock)
      }

      document.addEventListener('pointerdown', unlock)
      document.addEventListener('keydown', unlock)
    },

    bindVolumeControls: function () {
      if (!ui.volume || !ui.volumeValue) {
        this.setVolume(this.volume)
        return
      }

      ui.volume.value = Math.round(this.volume * 100)
      ui.volumeValue.textContent = Math.round(this.volume * 100) + '%'
      this.setVolume(this.volume)

      ui.volume.addEventListener('input', function () {
        let value = Number(ui.volume.value)
        sound.setVolume(value / 100)
        ui.volumeValue.textContent = Math.round(sound.volume * 100) + '%'
      })
    },

    setVolume: function (value01) {
      if (!Number.isFinite(value01)) return

      this.volume = Math.max(0, Math.min(1, value01))

      if (this.masterGain && this.context) {
        let now = this.context.currentTime

        this.masterGain.gain.cancelScheduledValues(now)
        this.masterGain.gain.setTargetAtTime(this.volume, now, 0.15)
      }
    },

    playTone: function (frequency, duration) {
      if (!this.enabled || !this.context || !this.masterGain) return

      if (this.context.state === 'suspended') {
        this.context.resume()
      }
      let oscillator = this.context.createOscillator()
      let gainNode = this.context.createGain()
      let now = this.context.currentTime

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, now)

      gainNode.gain.setValueAtTime(0.001, now)
      gainNode.gain.exponentialRampToValueAtTime(this.volume, now + 0.02)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.02)

      oscillator.connect(gainNode)
      gainNode.connect(this.masterGain)

      oscillator.start(now)
      oscillator.stop(now + duration + 0.02)

      oscillator.onended = function () {
        oscillator.disconnect()
        gainNode.disconnect()
      }
    },

    play: function (eventName) {
      if (!this.enabled) return

      switch (eventName) {
        case 'flip':
          this.playTone(500, 0.12)
          break
        case 'match':
          this.playTone(700, 0.1)
          this.playTone(900, 0.12)
          break
        case 'mismatch':
          this.playTone(200, 0.2)
          break
        case 'win':
          this.playTone(600, 0.15)
          this.playTone(800, 0.2)
          this.playTone(1000, 0.25)
          break
      }
    },
  }

  const game = {
    firstTile: null,
    secondTile: null,
    isLocked: false,
    totalPairs: 6,
    deck: [],
    state: {
      matchedPairs: 0,
      moves: 0,
      seconds: 0,
      timerId: null,
      isStarted: false,
    },

    init: function () {
      sound.init()
      this.bindEvents()
      this.startNewGame()
    },

    bindEvents: function () {
      const self = this

      //chanfe pair selector
      ui.pairsSelect.addEventListener('change', function () {
        self.updatePairsFromSelect()
        self.startNewGame()
      })

      ui.grid.addEventListener('click', function (event) {
        let tile = event.target.closest('.tile')
        if (tile) {
          self.onTileClick(tile)
        }
      })

      ui.restartButton.addEventListener('click', function () {
        self.startNewGame()
      })

      ui.playAgainButton.addEventListener('click', function () {
        self.startNewGame()
      })

      ui.closeButton.addEventListener('click', function () {
        self.closeWinOverlay()
      })
    },

    updatePairsFromSelect: function () {
      const value = Number(ui.pairsSelect.value)
      this.totalPairs = value
    },

    // startNewGame
    startNewGame: function () {
      this.closeWinOverlay()
      this.resetState()
      this.buildDeck()
      this.renderBoard()
    },

    closeWinOverlay: function () {
      ui.overlay.classList.remove('is-open')
    },

    resetState: function () {
      const state = this.state
      state.firstTile = null
      state.secondTile = null
      state.isLocked = false
      state.matchedPairs = 0
      state.moves = 0
      state.seconds = 0
      state.isStarted = false

      if (state.timerId) {
        clearInterval(state.timerId)
        state.timerId = null
      }

      ui.moves.textContent = '0'
      ui.time.textContent = '0:00'
      ui.pairs.textContent = '0/' + this.totalPairs
    },

    buildDeck: function () {
      let copy = icons.slice()
      copy = this.shuffleArray(copy)
      let selected = copy.slice(0, this.totalPairs)
      let doubled = selected.concat(selected)
      doubled = this.shuffleArray(doubled)

      this.deck = doubled.map(function (value, index) {
        return {
          id: index,
          value: value,
        }
      })
    },

    shuffleArray: function (array) {
      for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1))
        var temp = array[i]
        array[i] = array[j]
        array[j] = temp
      }
      return array
    },

    renderBoard: function () {
      let html = ''
      let i

      for (let i = 0; i < this.deck.length; i++) {
        html +=
          '<button class="tile" type="button" aria-label="Card"><div class="tile__inner"><div class="tile__face tile__front"><div class="tile__chip">?</div></div><div class="tile__face tile__back"><div class="tile__emoji"></div></div></div></button>'
      }

      ui.grid.innerHTML = html
      this.attachDataToTiles()
    },

    attachDataToTiles: function () {
      let tiles = ui.grid.querySelectorAll('.tile')
      let emojis = ui.grid.querySelectorAll('.tile__emoji')

      for (let i = 0; i < this.deck.length; i++) {
        tiles[i].dataset.value = this.deck[i].value
        emojis[i].textContent = this.deck[i].value
      }
    },

    onTileClick: function (tile) {
      let state = this.state
      if (state.isLocked) return
      if (tile.classList.contains('is-flipped')) return
      if (!state.isStarted) {
        state.isStarted = true
        this.startTimer()
      }
      tile.classList.add('is-flipped')
      sound.play('flip')

      if (!state.firstTile) {
        state.firstTile = tile
        return
      }
      state.secondTile = tile
      state.isLocked = true

      state.moves += 1
      ui.moves.textContent = state.moves

      this.checkPair()
    },

    startTimer: function () {
      let self = this

      if (this.state.timerId) return
      this.state.timerId = setInterval(function () {
        self.state.seconds += 1
        ui.time.textContent = self.formatTime(self.state.seconds)
      }, 1000)
    },

    formatTime: function (seconds) {
      let min = Math.floor(seconds / 60)
      let restSeconds = seconds % 60
      return min + ':' + String(restSeconds).padStart(2, 0)
    },

    checkPair: function () {
      let state = this.state
      if (state.firstTile.dataset.value === state.secondTile.dataset.value) {
        this.handleMatch()
      } else {
        this.handleMissMatch()
      }
    },

    handleMatch: function () {
      let state = this.state
      state.firstTile.classList.add('is-matched')
      state.secondTile.classList.add('is-matched')
      sound.play('match')

      state.matchedPairs += 1
      ui.pairs.textContent = state.matchedPairs + '/' + this.totalPairs

      this.clearSelection()

      if (state.matchedPairs === this.totalPairs) {
        this.showWin()
      }
    },

    handleMissMatch: function () {
      let self = this

      setTimeout(function () {
        self.state.firstTile.classList.remove('is-flipped')
        self.state.secondTile.classList.remove('is-flipped')
        self.clearSelection()
        sound.play('mismatch')
      }, 700)
    },

    clearSelection: function () {
      this.state.firstTile = null
      this.state.secondTile = null
      this.state.isLocked = false
    },

    showWin: function () {
      clearInterval(this.state.timerId)
      sound.play('win')

      ui.winText.textContent =
        'Moves: ' +
        this.state.moves +
        '\n' +
        'Time: ' +
        this.formatTime(this.state.seconds)

      ui.overlay.classList.add('is-open')
    },
  }

  game.init()
})()
