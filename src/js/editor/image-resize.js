import $ from '../util/dom-core.js'

function matchAngle(x, y, startAngle, endAngle) {
    let angle = Math.atan(x / y) / (Math.PI / 180)
    if (x <= 0 && y >= 0 || x >= 0 && y >= 0) {
        angle = 180 + angle
    }
    if (x >= 0 && y <= 0) {
        angle = 360 + angle
    }
    if (startAngle <= endAngle) {
        return angle >= startAngle && angle <= endAngle
    }
    return angle >= startAngle && angle <= 360 || angle <= endAngle && angle <= 0
}

/**
 * 图片调整大小
 */
function ImageResize(editor) {
    this.editor = editor
    this.mask = document.createElement('div')
    this.text = document.createElement('div')
    this.handlers = []

    this.currentComponent = null
    this.currentElement = null
    this.frameContainer = editor.$textContainerElem[0]

    this.renderer = null

    this._init()

    this.setup()
}

ImageResize.prototype = {
    constructor: ImageResize,

    _init: function () {
        this.mask.className = 'image-resize-hooks-handler'
        for (let i = 0; i < 4; i++) {
            const button = document.createElement('button')
            button.type = 'button'
            this.handlers.push(button)
        }
        this.mask.append(...this.handlers)
        this.mask.append(this.text)

        this.mask.addEventListener('mousedown', ev => {
            // if (!this.currentComponent) {
            //     return
            // }

            this.frameContainer.style.pointerEvents = 'none'

            const startRect = this.currentElement.getBoundingClientRect()
            //   this.currentComponent.width = startRect.width + 'px'
            //   this.currentComponent.height = startRect.height + 'px'

            const startX = ev.clientX
            const startY = ev.clientY

            const startWidth = startRect.width
            const startHeight = startRect.height
            const startHypotenuse = Math.sqrt(startWidth * startWidth + startHeight * startHeight)

            let endWidth = startWidth
            let endHeight = startHeight
            const index = this.handlers.indexOf(ev.target)
            const mouseMoveFn = (ev) => {

                const moveX = ev.clientX
                const moveY = ev.clientY

                const offsetX = moveX - startX
                const offsetY = moveY - startY

                // if ([0, 2, 4, 6].includes(index)) {

                const gainHypotenuse = Math.sqrt(offsetX * offsetX + offsetY * offsetY)
                let proportion = gainHypotenuse / startHypotenuse

                if (!(index === 0 && matchAngle(offsetX, offsetY, 315, 135) ||
                    index === 2 && matchAngle(offsetX, offsetY, 225, 45) ||
                    index === 4 && matchAngle(offsetX, offsetY, 135, 315) ||
                    index === 6 && matchAngle(offsetX, offsetY, 45, 225))) {
                    proportion = -proportion
                }

                endWidth = startWidth + startWidth * proportion
                endHeight = startHeight + startHeight * proportion
                this.currentElement.style.width = endWidth + 'px'
                this.currentElement.style.height = endHeight + 'px'
                // } else if ([1, 5].includes(index)) {
                //     endHeight = startHeight + (index === 1 ? -offsetY : offsetY)
                //     this.currentElement.style.height = endHeight + 'px'
                // } else if ([3, 7].includes(index)) {
                //     endWidth = startWidth + (index === 3 ? offsetX : -offsetX)
                //     this.currentElement.style.width = endWidth + 'px'
                // }

                this.updateStyle()
            }

            const mouseUpFn = () => {
                // this.currentComponent.width = endWidth + 'px'
                // this.currentComponent.height = endHeight + 'px'
                this.frameContainer.style.pointerEvents = ''
                // if (this.renderer) {
                //   const vEle = this.renderer.getVDomByNativeNode(this.currentElement) as VElement
                //   vEle.styles.set('width', endWidth + 'px')
                //   vEle.styles.set('height', endHeight + 'px')
                //   this.renderer.dispatchEvent(
                //     vEle,
                //     EventType.onContentUnexpectedlyChanged,
                //     null)
                // }
                // 
                document.removeEventListener('mousemove', mouseMoveFn)
                document.removeEventListener('mouseup', mouseUpFn)
            }
            document.addEventListener('mousemove', mouseMoveFn)
            document.addEventListener('mouseup', mouseUpFn)
        })
    },

    updateStyle: function () {
        const frameContainerRect = this.frameContainer.getBoundingClientRect()
        const rect = this.currentElement.getBoundingClientRect()
        const top = rect.top - frameContainerRect.top
        const left = rect.left - frameContainerRect.left
        this.mask.style.cssText = `left: ${left}px; top: ${top}px; width: ${rect.width}px; height: ${rect.height}px;`
        this.text.innerText = `${Math.round(rect.width)}px * ${Math.round(rect.height)}px`
        this.editor.cmd.do()
    },

    setup: function () {
        const editor = this.editor
        const $textElem = editor.$textElem
        const $this = this

        // 为图片增加 selected 样式
        $textElem.on('click', 'img', function (e) {
            const img = this
            const $img = $(img)

            if ($img.attr('data-w-e') === '1') {
                // 是表情图片，忽略
                return
            }

            $this.currentElement = img
            // this.currentComponent = position.fragment.getContentAtIndex(position.startIndex) as ImageComponent
            // this.frameContainer = frameContainer
            // const selection = contextDocument.getSelection()
            // selection.removeAllRanges()
            // const range = contextDocument.createRange()
            // range.selectNode(srcElement)
            // selection.addRange(range)
            $this.updateStyle()
            $this.frameContainer.append($this.mask)
            console.log('add mask')
        })

        // 去掉图片的 selected 样式
        $textElem.on('click  keyup', e => {
            if (e.target.matches('img')) {
                // 点击的是图片，忽略
                return
            }

            $this.currentElement = null
            $this.currentComponent = null
            if ($this.mask.parentNode) {
                $this.mask.parentNode.removeChild($this.mask)
            }
        })
    }

}

export default ImageResize