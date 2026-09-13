// This script lets you worry less about broken links and help readers who use an incorrect link.
// It shows the closest matching link.
// To use:
// Include this script on your 404.html page.
// Make sure to generate a sitemap to sitemap.txt
// Make sure your page has a div with the id "helpfulNotFound".
// This script will fetch your sitemap, find the closest matching link, and suggest that to the user.
class NotFoundApp {
  constructor(sitemapUrls = "/sitemap.txt") {
    this.load(sitemapUrls)
  }

  async load(sitemapUrls) {
    const getSuggestion = async () => {
      const currentUrl = window.location.href
      // Function to calculate the Levenshtein distance between two strings
      function levenshteinDistance(a, b) {
        const m = a.length
        const n = b.length
        const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
        for (let i = 0; i <= m; i++) {
          dp[i][0] = i
        }
        for (let j = 0; j <= n; j++) {
          dp[0][j] = j
        }
        for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
          }
        }
        return dp[m][n]
      }

      try {
        const responses = await Promise.all(sitemapUrls.split(" ").map(async url => await fetch(url)))
        const sitemap = await Promise.all(responses.map(async response => await response.text()))
        const urls = sitemap.join("\n").split("\n")

        let closestMatch = null
        let minDistance = Infinity

        urls.forEach(url => {
          const trimmedUrl = url.trim()
          if (trimmedUrl) {
            const distance = levenshteinDistance(currentUrl, trimmedUrl)
            if (distance < minDistance) {
              minDistance = distance
              closestMatch = trimmedUrl
            }
          }
        })

        return closestMatch
      } catch (error) {
        console.error("Failed to fetch the sitemap:", error)
      }
    }

    const closestMatch = await getSuggestion()
    const outputDiv = document.getElementById("helpfulNotFound")
    if (closestMatch) outputDiv.innerHTML = `Maybe the url you want is<br><a href="${closestMatch}">${closestMatch}</a>?`
    else outputDiv.parentElement.textContent = "No similar pages found."
  }
}
