# Wastely website

The marketing site for Wastely, served by GitHub Pages at https://teamwastely.com.

## Pages

- `index.html`: homepage with the interactive sorting demo (`demo.js`)
- `product.html`: how the product works
- `demo.html`: demo booking, linked to the Cal.com event
- `contact.html`: question form (`contact.js`), delivered through Web3Forms
- `404.html`: shown for missing pages

`styles.css` holds the shared base styles and animations. Page layout uses inline styles.

## Things you may need to change

- **Contact form key:** the Web3Forms access key is the hidden `access_key` field near the top of the form in `contact.html`. The form is registered for teamwastely.com.
- **Booking link:** in `demo.html`, the "Choose a time" button points to the Cal.com event.
- **Demo rules:** the item and city rules shown in the homepage demo live at the top of `demo.js`.

Any change pushed to the `main` branch goes live within a minute or two.
