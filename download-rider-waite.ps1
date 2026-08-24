$ErrorActionPreference = "Stop"
$base = "https://raw.githubusercontent.com/geraldfingburke/plateau-tarot-api/master/images"
$target = Join-Path (Get-Location) "public\cards\rider-waite"
New-Item -ItemType Directory -Force -Path $target | Out-Null
$cards = @(
    @{ src = "The%20Fool.jpg"; dest = "major-00.jpg" },
    @{ src = "The%20Magician.jpg"; dest = "major-01.jpg" },
    @{ src = "The%20High%20Priestess.jpg"; dest = "major-02.jpg" },
    @{ src = "The%20Empress.jpg"; dest = "major-03.jpg" },
    @{ src = "The%20Emperor.jpg"; dest = "major-04.jpg" },
    @{ src = "The%20Hierophant.jpg"; dest = "major-05.jpg" },
    @{ src = "The%20Lovers.jpg"; dest = "major-06.jpg" },
    @{ src = "The%20Chariot.jpg"; dest = "major-07.jpg" },
    @{ src = "Strength.jpg"; dest = "major-08.jpg" },
    @{ src = "The%20Hermit.jpg"; dest = "major-09.jpg" },
    @{ src = "The%20Wheel%20of%20Fortune.jpg"; dest = "major-10.jpg" },
    @{ src = "Justice.jpg"; dest = "major-11.jpg" },
    @{ src = "The%20Hanged%20Man.jpg"; dest = "major-12.jpg" },
    @{ src = "Death.jpg"; dest = "major-13.jpg" },
    @{ src = "Temperance.jpg"; dest = "major-14.jpg" },
    @{ src = "The%20Devil.jpg"; dest = "major-15.jpg" },
    @{ src = "The%20Tower.jpg"; dest = "major-16.jpg" },
    @{ src = "The%20Star.jpg"; dest = "major-17.jpg" },
    @{ src = "The%20Moon.jpg"; dest = "major-18.jpg" },
    @{ src = "The%20Sun.jpg"; dest = "major-19.jpg" },
    @{ src = "Judgement.jpg"; dest = "major-20.jpg" },
    @{ src = "The%20World.jpg"; dest = "major-21.jpg" },
    @{ src = "Ace%20of%20Wands.jpg"; dest = "wands-ace.jpg" },
    @{ src = "Two%20of%20Wands.jpg"; dest = "wands-two.jpg" },
    @{ src = "Three%20of%20Wands.jpg"; dest = "wands-three.jpg" },
    @{ src = "Four%20of%20Wands.jpg"; dest = "wands-four.jpg" },
    @{ src = "Five%20of%20Wands.jpg"; dest = "wands-five.jpg" },
    @{ src = "Six%20of%20Wands.jpg"; dest = "wands-six.jpg" },
    @{ src = "Seven%20of%20Wands.jpg"; dest = "wands-seven.jpg" },
    @{ src = "Eight%20of%20Wands.jpg"; dest = "wands-eight.jpg" },
    @{ src = "Nine%20of%20Wands.jpg"; dest = "wands-nine.jpg" },
    @{ src = "Ten%20of%20Wands.jpg"; dest = "wands-ten.jpg" },
    @{ src = "Page%20of%20Wands.jpg"; dest = "wands-page.jpg" },
    @{ src = "Knight%20of%20Wands.jpg"; dest = "wands-knight.jpg" },
    @{ src = "Queen%20of%20Wands.jpg"; dest = "wands-queen.jpg" },
    @{ src = "King%20of%20Wands.jpg"; dest = "wands-king.jpg" },
    @{ src = "Ace%20of%20Cups.jpg"; dest = "cups-ace.jpg" },
    @{ src = "Two%20of%20Cups.jpg"; dest = "cups-two.jpg" },
    @{ src = "Three%20of%20Cups.jpg"; dest = "cups-three.jpg" },
    @{ src = "Four%20of%20Cups.jpg"; dest = "cups-four.jpg" },
    @{ src = "Five%20of%20Cups.jpg"; dest = "cups-five.jpg" },
    @{ src = "Six%20of%20Cups.jpg"; dest = "cups-six.jpg" },
    @{ src = "Seven%20of%20Cups.jpg"; dest = "cups-seven.jpg" },
    @{ src = "Eight%20of%20Cups.jpg"; dest = "cups-eight.jpg" },
    @{ src = "Nine%20of%20Cups.jpg"; dest = "cups-nine.jpg" },
    @{ src = "Ten%20of%20Cups.jpg"; dest = "cups-ten.jpg" },
    @{ src = "Page%20of%20Cups.jpg"; dest = "cups-page.jpg" },
    @{ src = "Knight%20of%20Cups.jpg"; dest = "cups-knight.jpg" },
    @{ src = "Queen%20of%20Cups.jpg"; dest = "cups-queen.jpg" },
    @{ src = "King%20of%20Cups.jpg"; dest = "cups-king.jpg" },
    @{ src = "Ace%20of%20Swords.jpg"; dest = "swords-ace.jpg" },
    @{ src = "Two%20of%20Swords.jpg"; dest = "swords-two.jpg" },
    @{ src = "Three%20of%20Swords.jpg"; dest = "swords-three.jpg" },
    @{ src = "Four%20of%20Swords.jpg"; dest = "swords-four.jpg" },
    @{ src = "Five%20of%20Swords.jpg"; dest = "swords-five.jpg" },
    @{ src = "Six%20of%20Swords.jpg"; dest = "swords-six.jpg" },
    @{ src = "Seven%20of%20Swords.jpg"; dest = "swords-seven.jpg" },
    @{ src = "Eight%20of%20Swords.jpg"; dest = "swords-eight.jpg" },
    @{ src = "Nine%20of%20Swords.jpg"; dest = "swords-nine.jpg" },
    @{ src = "Ten%20of%20Swords.jpg"; dest = "swords-ten.jpg" },
    @{ src = "Page%20of%20Swords.jpg"; dest = "swords-page.jpg" },
    @{ src = "Knight%20of%20Swords.jpg"; dest = "swords-knight.jpg" },
    @{ src = "Queen%20of%20Swords.jpg"; dest = "swords-queen.jpg" },
    @{ src = "King%20of%20Swords.jpg"; dest = "swords-king.jpg" },
    @{ src = "Ace%20of%20Pentacles.jpg"; dest = "pentacles-ace.jpg" },
    @{ src = "Two%20of%20Pentacles.jpg"; dest = "pentacles-two.jpg" },
    @{ src = "Three%20of%20Pentacles.jpg"; dest = "pentacles-three.jpg" },
    @{ src = "Four%20of%20Pentacles.jpg"; dest = "pentacles-four.jpg" },
    @{ src = "Five%20of%20Pentacles.jpg"; dest = "pentacles-five.jpg" },
    @{ src = "Six%20of%20Pentacles.jpg"; dest = "pentacles-six.jpg" },
    @{ src = "Seven%20of%20Pentacles.jpg"; dest = "pentacles-seven.jpg" },
    @{ src = "Eight%20of%20Pentacles.jpg"; dest = "pentacles-eight.jpg" },
    @{ src = "Nine%20of%20Pentacles.jpg"; dest = "pentacles-nine.jpg" },
    @{ src = "Ten%20of%20Pentacles.jpg"; dest = "pentacles-ten.jpg" },
    @{ src = "Page%20of%20Pentacles.jpg"; dest = "pentacles-page.jpg" },
    @{ src = "Knight%20of%20Pentacles.jpg"; dest = "pentacles-knight.jpg" },
    @{ src = "Queen%20of%20Pentacles.jpg"; dest = "pentacles-queen.jpg" },
    @{ src = "King%20of%20Pentacles.jpg"; dest = "pentacles-king.jpg" }
)

$i = 0
foreach ($card in $cards) {
    $i++
    $url = "$base/$($card.src)"
    $file = Join-Path $target $card.dest
    Write-Host "[$i/78] $($card.dest)"
    Invoke-WebRequest -Uri $url -OutFile $file -UseBasicParsing
}

$backUrl = "$base/Card%20Back.jpg"
$backFile = Join-Path $target "card-back.jpg"
Invoke-WebRequest -Uri $backUrl -OutFile $backFile -UseBasicParsing
Write-Host ""
Write-Host "XONG: Da tai 78 la + mat lung vao $target" -ForegroundColor Green