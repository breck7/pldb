cd "$(dirname "$0")"
mkdir cache
# wget -O cache/langAnnouncements.json "https://www.reddit.com/r/ProgrammingLanguages/search.json?q=%22Language%20announcement%22&restrict_sr=true"
# wget -O cache/langAnnouncements.json https://www.reddit.com/r/ProgrammingLanguages/.json?f=flair_name%3A%22Language%20announcement%22


# https://github.com/aliparlakci/bulk-downloader-for-reddit
# /opt/homebrew/bin/python3 -m bdfr clone cache --subreddit ProgrammingLanguages --format json --sort top