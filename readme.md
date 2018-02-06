# [NHS Top-up](https://therealmolen.github.io/nhs/)

Many of us share a feeling that we'd pay a little more tax if we knew it was going to the NHS.
In fact, [this survey](https://www.mirror.co.uk/news/politics/three-quarters-brits-would-pay-11955709) recently found that up to three-quarters of Brits would be happy to pay more to support the NHS.

**So let's do that!**

Most NHS Trusts have a charity that you can easily set up monthly payments to, and the money will go straight into improving care in our NHS.

[This page](https://therealmolen.github.io/nhs/) will help you figure out how much money an extra 1% of tax would be for you, and help you find the page for your local NHS trust so you can set up a monthly payment of that amount. If we all chipped in a percent or two, it wouldn't affect us too much, but it **would mean the world for our NHS**.

## Where is the data from?

The tax calculation is based on the rules as I understand them from [HMRC](https://www.gov.uk/government/publications/rates-and-allowances-income-tax/income-tax-rates-and-allowances-current-and-past#tax-rates-and-bands). I'm not a financial professional (I make videogames!), but I believe I have the basic calculation correct. It doesn't take into account anything beyond basic tax band calculations, but hopefully people are able to adjust the calculation up or down depending on their personal circumstances.

The postcode-to-coordinates lookup is courtesy of [postcodes.io](http://postcodes.io).

The data used to find the nearest hospital to a postcode is from [NHS Choices](https://www.nhs.uk/aboutNHSChoices/aboutnhschoices/how-we-perform/Pages/datasets.aspx">https://www.nhs.uk/aboutNHSChoices/aboutnhschoices/how-we-perform/Pages/datasets.aspx) _(downloaded on 30th Jan 2018)_. The raw data contains data for a huge number of non-NHS Trust facilities, so I've stripped those out, along with a lot of columns of data that weren't necessary, to keep download size down.

The [charity data](https://raw.githubusercontent.com/TheRealMolen/nhs/master/data/NHSCharities.csv) was all painstakingly captured by hand by me. If you find any issues in it, please let me know (or ideally send me a PR for the fix!). Please feel free to use the data for anything that supports the NHS.
          