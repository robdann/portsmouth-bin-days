import express from 'express';
import {chromium} from "playwright-core";

const app = express();

app.use(express.json());

app.get('/data', async (req, res) => {
    const {postCode, firstLine} = req.query;
    const browser = await chromium.launch({headless: false});
    try {
        const page = await browser.newPage();
        await page.goto('https://my.portsmouth.gov.uk/en/AchieveForms/?form_uri=sandbox-publish://AF-Process-26e27e70-f771-47b1-a34d-af276075cede/AF-Stage-cd7cc291-2e59-42cc-8c3f-1f93e132a2c9/definition.json&redirectlink=%2Fen&cancelRedirectLink=%2Fen');
        await page.waitForLoadState('networkidle');
        const frameLocator = page.locator('iframe[title="Find your collection dates"]').contentFrame();
        const postCodeSearch = frameLocator.getByRole('textbox', {name: 'Postcode / Road search'});
        await postCodeSearch.click();
        await postCodeSearch.fill(postCode);
        await frameLocator.locator('button[name="lookupAddress"]').click();
        await page.waitForLoadState('networkidle');
        const selectLocator = frameLocator.getByLabel('Choose address *');
        await selectLocator.waitFor();
        const optionToSelect = selectLocator.locator(
            `option:text-matches("${firstLine}", "i")`
        ).first();
        console.log(optionToSelect);
        await selectLocator.selectOption({value: await optionToSelect.getAttribute('value')});
        await page.waitForLoadState('networkidle');
        const rubbish = await frameLocator.locator('h4:has-text("Rubbish - next 10 collection dates") + p').innerText().then(t => t.split('\n').find(l => l.trim()));
        const recycling = await frameLocator.locator('h4:has-text("Recycling - next 10 collection dates") + p').innerText().then(t => t.split('\n').find(l => l.trim()));
        res.json({postCode, firstLine, rubbish, recycling})
    } finally {
        await browser.close();
    }
});
app.listen(process.env.PORT || 3000, () => {
    // listening
});