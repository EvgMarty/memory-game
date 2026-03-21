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

  const sound = []

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
      state.matchedPairs = 6
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
  }

  game.init()
})()
