# Personal Portfolio Website

A modern, responsive portfolio website built with HTML, CSS, and JavaScript. Features a clean design with smooth animations and mobile-friendly navigation.

## Features

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, professional design with smooth animations
- **Interactive Elements**: Hover effects, smooth scrolling, and dynamic navigation
- **Mobile Navigation**: Hamburger menu for mobile devices
- **Project Showcase**: Beautiful cards to display your projects
- **Skills Section**: Organized display of your technical skills
- **Social Links**: Easy access to LinkedIn, GitHub, email, and resume

## Sections

1. **Hero Section**: Eye-catching introduction with your name and title
2. **About Me**: Personal description and skills showcase
3. **Projects**: Featured projects with descriptions and links
4. **Contact**: Social media links and contact information

## Customization Guide

### Personal Information

1. **Update your name and title** in `index.html`:
   ```html
   <title>Your Name - Portfolio</title>
   <h1 class="hero-title">Hi, I'm <span class="highlight">Your Name</span></h1>
   <p class="hero-subtitle">Full Stack Developer & Creative Problem Solver</p>
   ```

2. **Customize the about section** with your personal story and skills

3. **Update project information** with your actual projects:
   - Project titles and descriptions
   - Technology tags
   - GitHub and live demo links

### Social Links

Update the social links in `script.js`:
```javascript
const socialLinks = {
    '.social-link.linkedin': 'https://linkedin.com/in/yourprofile',
    '.social-link.github': 'https://github.com/yourusername',
    '.social-link.email': 'mailto:your.email@example.com',
    '.social-link.resume': '/path/to/your/resume.pdf'
};
```

### Styling

- **Colors**: Modify the CSS variables in `styles.css` to match your brand
- **Fonts**: Change the Google Fonts import to use different fonts
- **Layout**: Adjust grid layouts and spacing as needed

### Adding Your Photo

Replace the placeholder in the hero section:
```html
<div class="hero-image">
    <img src="path/to/your/photo.jpg" alt="Your Name" class="profile-photo">
</div>
```

And add corresponding CSS:
```css
.profile-photo {
    width: 300px;
    height: 300px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(255, 255, 255, 0.2);
}
```

## Deployment

### GitHub Pages (Free)

1. Create a new repository on GitHub
2. Upload all files to the repository
3. Go to Settings > Pages
4. Select "Deploy from a branch" and choose "main"
5. Your site will be available at `https://yourusername.github.io/repository-name`

### Netlify (Free)

1. Drag and drop your project folder to [Netlify](https://netlify.com)
2. Your site will be deployed instantly
3. You can set up a custom domain if desired

### Vercel (Free)

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in your project directory
3. Follow the prompts to deploy

## File Structure

```
portfolio/
├── index.html          # Main HTML file
├── styles.css          # CSS styles
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Features

- Optimized CSS with efficient selectors
- Smooth scrolling and animations
- Lazy loading for better performance
- Mobile-first responsive design

## Customization Tips

1. **Add more sections**: Copy existing section structure and modify content
2. **Change color scheme**: Update CSS custom properties for consistent theming
3. **Add animations**: Use CSS animations or JavaScript for more interactive elements
4. **SEO optimization**: Add meta tags, Open Graph tags, and structured data
5. **Analytics**: Add Google Analytics or other tracking tools

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you need help customizing your portfolio, feel free to:
- Check the code comments for guidance
- Modify the CSS variables for easy theming
- Add your own sections and features

Happy coding! 🚀
