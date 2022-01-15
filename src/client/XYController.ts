export type Vec2 = {
    x: number
    y: number
}

export class XYController {
    private coords: Vec2 = { x: 0, y: 0 }
    private value: Vec2 = { x: 0, y: 0 }
    private buttonSize: Vec2 = { x: 0, y: 0 }

    private canvas: HTMLCanvasElement
    private onChangeCallback: (value: Vec2) => void
    private onClickCallBack?: () => void | undefined

    constructor(
        canvas: HTMLCanvasElement,
        onChangeCallback: (value: Vec2) => void,
        onClickCallBack?: () => void | undefined
    ) {
        canvas.style.display = 'block'
        this.onChangeCallback = onChangeCallback
        this.onClickCallBack = onClickCallBack
        this.canvas = canvas
        this.canvas.width = this.canvas.offsetWidth
        this.canvas.height = this.canvas.offsetHeight
        this.coords = { x: this.canvas.width / 2, y: this.canvas.height / 2 }
        this.buttonSize = { x: this.canvas.width / 10, y: this.canvas.height / 10 }

        this.update()

        this.canvas.addEventListener('pointerdown', () => {
            if (this.onClickCallBack) {
                this.onClickCallBack()
            }
        })

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault()
            let touchesId = 0 //use the touchId of the touch within the boundary of the canvas
            if (
                e.touches[0].screenX > this.canvas.offsetLeft &&
                e.touches[0].screenX < this.canvas.offsetLeft + this.canvas.width
            ) {
                touchesId = 0
            } else {
                touchesId = 1 //assume that there is a max of 2 possible fingers on the screen
            }
            this.coords.x = e.touches[touchesId].screenX - this.canvas.offsetLeft
            this.coords.y = e.touches[touchesId].screenY - this.canvas.offsetTop
        })

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault()
            this.coords.x = this.canvas.width / 2
            this.coords.y = this.canvas.height / 2
        })

        this.canvas.addEventListener('mousemove', (e) => {
            if (e.button === 1) {
                this.coords.x = e.pageX - this.canvas.offsetLeft
                this.coords.y = e.pageY - this.canvas.offsetTop
            }
        })

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 1) {
                this.coords.x = this.canvas.clientWidth / 2
                this.coords.y = this.canvas.clientHeight / 2
            }
        })

        setInterval(() => {
            this.update()
        }, 20)
    }

    private update() {
        this.value.x =
            ((this.canvas.clientWidth / 2 - this.coords.x) /
                this.canvas.clientWidth) *
            2
        this.value.y =
            ((this.canvas.clientHeight / 2 - this.coords.y) /
                this.canvas.clientWidth) *
            2
        this.onChangeCallback(this.value)
        const ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D
        ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight)
        ctx.fillStyle = 'black'
        ctx.fillRect(
            this.coords.x - this.buttonSize.x / 2,
            this.coords.y - this.buttonSize.y / 2,
            this.buttonSize.x,
            this.buttonSize.y
        )
    }
}
