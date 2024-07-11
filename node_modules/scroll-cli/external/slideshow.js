class SlideShow {
  constructor() {
    const hash = window.location.hash.replace("#", "")
    this.page = hash === "" ? 1 : parseInt(hash)
    window.location.hash = "#" + this.page
    this.listenToKeyboard()
    this.listenToHash()
    this.renderAll()
  }

  renderSlide() {
    jQuery(this.slides[this.page - 1]).show()
    jQuery(".dinkus").hide()
  }

  hideAll() {
    jQuery("div,p,figure,code,pre").hide()
  }

  get slides() {
    return jQuery(".dinkus")
      .map(function () {
        return jQuery(this).prevUntil(".dinkus").addBack().prev()
      })
      .get()
      .slice(1)
  }

  renderAll() {
    this.hideAll()
    this.renderSlide()
    this.renderNav()
  }

  listenToKeyboard() {
    document.addEventListener("keydown", function (event) {
      if (document.activeElement !== document.body) return
      const getLinks = () => document.getElementsByClassName("slideshowNav")[0].getElementsByTagName("a")
      if (event.key === "ArrowLeft") getLinks()[0].click()
      else if (event.key === "ArrowRight") getLinks()[1].click()
    })
  }

  listenToHash() {
    window.addEventListener("hashchange", event => {
      this.page = parseInt(window.location.hash.replace("#", ""))
      this.hideAll()
      this.renderAll()
    })
  }

  renderNav() {
    const that = this
    jQuery(".slideshowNav").html(this.nav).show()
    jQuery(".slideshowNav a").on("click", function (event) {
      event.preventDefault()
      that.page = parseInt(jQuery(this).attr("href").replace("#", ""))
      that.renderAll()
      window.location.hash = "#" + that.page
    })
  }

  page = 1

  get pages() {
    return this.slides.length
  }

  get previousPage() {
    let { page } = this
    page--
    if (page === 0) page = this.pages
    return page
  }

  get nextPage() {
    let { page } = this
    page++
    if (page > this.pages) page = 1
    return page
  }

  get nav() {
    return `<a href="#${this.previousPage}">&lt;</a> ${this.page}/${this.pages} <a href="#${this.nextPage}">&gt;</a>`
  }
}

document.addEventListener("DOMContentLoaded", () => new SlideShow())
