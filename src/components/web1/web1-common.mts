const lc = `[${import.meta.url}]`;

console.error(`${lc} this does not work. we cannot get a reference to the shadow root of the containing web component. use javascript within the web component instance. I have left this file here to tell this error. YMMV (E: 76ddf3f650dab283724c0c1144fa7a25)`);

// const asideElements = document.querySelectorAll('.web1-page aside'); // Get aside element

// asideElements.forEach(el => {
//     setTimeout(() => {
//         el.classList.add('unblurred'); // Add 'unblurred' class after delay
//     }, 1000); // Adjust delay (in milliseconds) as needed
// })

console.log('web1-common.mts executed');
