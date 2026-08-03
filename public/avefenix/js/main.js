document.addEventListener('DOMContentLoaded', () => {
    // 1. Navbar Scroll Logic (Ultra Optimizado con requestAnimationFrame)
    const header = document.querySelector('header');
    let ticking = false;

    const handleScroll = () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                if (window.scrollY > 50) {
                    header.classList.add('bg-background-dark/80', 'backdrop-blur-md', 'border-b', 'border-white/5');
                    header.classList.remove('bg-transparent');
                } else {
                    header.classList.remove('bg-background-dark/80', 'backdrop-blur-md', 'border-b', 'border-white/5');
                    header.classList.add('bg-transparent');
                }
                ticking = false;
            });
            ticking = true;
        }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 2. Mobile Menu Toggle — handled by inline script in index.html

    // 3. Locations Parallax
    const locationsSection = document.getElementById('locations');
    const mapBackground = document.getElementById('map-background');
    const pinsContainer = document.getElementById('pins-container');

    if (locationsSection && mapBackground) {
        const updateParallax = () => {
            const rect = locationsSection.getBoundingClientRect();
            const height = rect.height;
            const windowHeight = window.innerHeight;
            const rawProgress = -rect.top / (height - windowHeight);
            const progress = Math.max(0, Math.min(1, rawProgress));

            mapBackground.style.transform = `scale(${1 + progress * 0.2})`;
            if (pinsContainer) {
                pinsContainer.style.transform = `scale(${1 + progress * 0.2})`;
            }
        };
        window.addEventListener('scroll', updateParallax, { passive: true });
        updateParallax();
    }

    // 4. Hero Video - Congelar al hacer scroll
    const heroSection = document.getElementById('home');
    const heroVideo = heroSection ? heroSection.querySelector('video') : null;

    if (heroSection && heroVideo) {
        const heroObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    heroVideo.play().catch(() => { });
                } else {
                    heroVideo.pause();
                }
            });
        }, { threshold: 0.05 });
        heroObserver.observe(heroSection);
    }

    // 5. Sliders de las Cards (Congelar videos y tiempo cuando no se ven)
    const sliders = document.querySelectorAll('.slider-container');

    sliders.forEach(slider => {
        const images = slider.querySelectorAll('.slider-image');
        const dots = slider.querySelectorAll('.slider-dot');
        const prevBtn = slider.querySelector('.prev-btn');
        const nextBtn = slider.querySelector('.next-btn');

        let currentIndex = 0;
        let slideTimer;
        let isInView = false;

        const interval = parseInt(slider.dataset.interval) || 3000;
        const delay = parseInt(slider.dataset.delay) || 0;

        const sliderObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isInView = entry.isIntersecting;
                const activeVideo = images[currentIndex].querySelector('video');

                if (isInView) {
                    if (activeVideo) {
                        activeVideo.play().catch(() => { });
                    } else {
                        clearTimeout(slideTimer);
                        slideTimer = setTimeout(nextImage, interval + delay);
                    }
                } else {
                    if (activeVideo) activeVideo.pause();
                    clearTimeout(slideTimer);
                }
            });
        }, { threshold: 0.05 });

        sliderObserver.observe(slider);

        const showImage = (index) => {
            clearTimeout(slideTimer);

            images.forEach((img, i) => {
                const video = img.querySelector('video');

                if (i === index) {
                    img.classList.remove('opacity-0', 'scale-110');
                    img.classList.add('opacity-100', 'scale-100');

                    if (video) {
                        video.currentTime = 0;
                        if (isInView) {
                            video.play().catch(() => { });
                        }
                        video.onended = nextImage;
                    } else {
                        if (isInView) {
                            slideTimer = setTimeout(nextImage, interval);
                        }
                    }
                } else {
                    img.classList.add('opacity-0', 'scale-110');
                    img.classList.remove('opacity-100', 'scale-100');

                    if (video) {
                        video.pause();
                        video.onended = null;
                    }
                }
            });

            dots.forEach((dot, i) => {
                const activeClass = dot.dataset.activeClass;
                if (i === index) {
                    dot.classList.remove('w-8', 'w-6', 'w-1.5', 'w-1', 'bg-white/50');
                    dot.classList.add('w-8', activeClass);
                } else {
                    dot.classList.remove('w-8', 'w-6', 'w-1.5', 'w-1', activeClass);
                    dot.classList.add('w-1.5', 'bg-white/50');
                }
            });
            currentIndex = index;
        };

        const nextImage = () => { showImage((currentIndex + 1) % images.length); };
        const prevImage = () => { showImage((currentIndex - 1 + images.length) % images.length); };

        if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevImage(); });
        if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextImage(); });

        showImage(0);
    });

    // 6. Live Impact Counter Animation
    const impactCounter = document.getElementById('impact-counter');

    if (impactCounter) {
        // Calculate a realistic base number based on current time of day
        // Total daily impacts: ~190,000 across all screens
        const DAILY_TOTAL = 190000;
        const now = new Date();
        const hourFraction = (now.getHours() * 60 + now.getMinutes()) / (24 * 60);

        // Screens run 7AM-12AM (midnight), weight impacts during active hours
        let activeProgress = 0;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = 7 * 60;   // 7:00 AM
        const endMinutes = 24 * 60;    // 12:00 AM

        if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
            activeProgress = (currentMinutes - startMinutes) / (endMinutes - startMinutes);
        } else if (currentMinutes < startMinutes) {
            activeProgress = 0; // Before 7 AM
        } else {
            activeProgress = 1; // After midnight
        }

        // Apply a slight curve to make it feel more organic
        const baseCount = Math.floor(DAILY_TOTAL * activeProgress * (0.85 + Math.random() * 0.15));
        let currentCount = 0;

        // Smooth count-up animation on page load
        const countUpDuration = 2500; // 2.5 seconds
        const countUpStart = performance.now();

        const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

        const animateCountUp = (timestamp) => {
            const elapsed = timestamp - countUpStart;
            const progress = Math.min(elapsed / countUpDuration, 1);
            const easedProgress = easeOutQuart(progress);

            currentCount = Math.floor(baseCount * easedProgress);
            impactCounter.textContent = currentCount.toLocaleString('es-AR');

            if (progress < 1) {
                requestAnimationFrame(animateCountUp);
            } else {
                currentCount = baseCount;
                impactCounter.textContent = currentCount.toLocaleString('es-AR');
                // Start live increments after count-up finishes
                startLiveIncrements();
            }
        };

        requestAnimationFrame(animateCountUp);

        // Live increments - add small random amounts every few seconds
        const startLiveIncrements = () => {
            const addIncrement = () => {
                // Add 3-12 impacts per tick (realistic for a multi-screen circuit)
                const increment = Math.floor(Math.random() * 10) + 3;
                currentCount += increment;
                impactCounter.textContent = currentCount.toLocaleString('es-AR');

                // Brief flash effect on update
                impactCounter.classList.add('counter-flash');
                setTimeout(() => impactCounter.classList.remove('counter-flash'), 400);

                // Next increment in 2-5 seconds (variable for organic feel)
                const nextDelay = 2000 + Math.random() * 3000;
                setTimeout(addIncrement, nextDelay);
            };

            // Start first increment after a short pause
            setTimeout(addIncrement, 1500);
        };
    }

    // 7. How It Works - Scroll Reveal & Timeline Animation
    const hiwSection = document.getElementById('how-it-works');
    const hiwAnimateElements = document.querySelectorAll('.hiw-animate');
    const hiwTimelineProgress = document.querySelector('.hiw-timeline-progress');
    const hiwTravelDot = document.querySelector('.hiw-travel-dot');

    if (hiwAnimateElements.length > 0) {
        const hiwObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const allHiw = Array.from(hiwAnimateElements);
                    const index = allHiw.indexOf(entry.target);

                    // Stagger: header items fast, steps slower with more delay
                    let delay;
                    if (index < 3) {
                        // Header elements (subtitle, title, description)
                        delay = index * 120;
                    } else {
                        // Steps + CTA: more dramatic stagger
                        delay = 300 + (index - 3) * 200;
                    }

                    setTimeout(() => {
                        entry.target.classList.add('hiw-visible');
                    }, delay);

                    hiwObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        hiwAnimateElements.forEach(el => hiwObserver.observe(el));
    }

    // Timeline animation trigger
    if (hiwSection && hiwTimelineProgress) {
        const timelineObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Animate the progress line
                    setTimeout(() => {
                        hiwTimelineProgress.style.transform = 'scaleX(1)';
                    }, 600);

                    // Activate traveling dot
                    if (hiwTravelDot) {
                        hiwTravelDot.classList.add('hiw-dot-active');
                    }

                    timelineObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        timelineObserver.observe(hiwSection);
    }

    // 8. FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const trigger = item.querySelector('.faq-trigger');
        const content = item.querySelector('.faq-content');

        if (!trigger || !content) return;

        trigger.addEventListener('click', () => {
            const isActive = item.classList.contains('faq-active');

            // Close all FAQ items first
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('faq-active');
                    const otherContent = otherItem.querySelector('.faq-content');
                    const otherTrigger = otherItem.querySelector('.faq-trigger');
                    if (otherContent) {
                        otherContent.style.maxHeight = '0';
                        otherContent.style.opacity = '0';
                    }
                    if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
                }
            });

            // Toggle current item
            if (isActive) {
                item.classList.remove('faq-active');
                content.style.maxHeight = '0';
                content.style.opacity = '0';
                trigger.setAttribute('aria-expanded', 'false');
            } else {
                item.classList.add('faq-active');
                content.style.maxHeight = content.scrollHeight + 'px';
                content.style.opacity = '1';
                trigger.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // 7. FAQ Scroll Reveal Animation (staggered)
    const faqAnimateElements = document.querySelectorAll('.faq-animate');

    if (faqAnimateElements.length > 0) {
        const faqObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Stagger delay based on element index within its parent
                    const allAnimated = Array.from(faqAnimateElements);
                    const index = allAnimated.indexOf(entry.target);
                    const delay = Math.min(index * 80, 800); // max 800ms stagger

                    setTimeout(() => {
                        entry.target.classList.add('faq-visible');
                    }, delay);

                    faqObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        faqAnimateElements.forEach(el => faqObserver.observe(el));
    }

    // 8. FAQ Schema.org Structured Data (SEO boost)
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "¿Cuánto tiempo dura cada spot publicitario en las pantallas?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Cada spot tiene una duración de 10 a 15 segundos, rotando en bloques junto con otros anunciantes. Dependiendo del plan elegido, tu publicidad se repite entre 60 y 180 veces por día en cada pantalla."
                }
            },
            {
                "@type": "Question",
                "name": "¿Ustedes diseñan el video o lo tengo que traer hecho?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "¡Las dos opciones! Podés traer tu pieza ya diseñada en formato MP4 o imagen, y nosotros la adaptamos. También contamos con un equipo de diseño que crea tu spot desde cero, incluyendo animaciones y efectos."
                }
            },
            {
                "@type": "Question",
                "name": "¿Puedo elegir en qué pantallas aparece mi publicidad?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "¡Sí, absolutamente! Podés contratar una pantalla individual o armar un circuito personalizado. Te asesoramos para elegir las ubicaciones más estratégicas según tu público objetivo."
                }
            },
            {
                "@type": "Question",
                "name": "¿Cuál es la contratación mínima?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "La contratación mínima es de 1 mes por pantalla. Sin embargo, ofrecemos planes más cortos para eventos, lanzamientos o campañas especiales. A mayor cantidad de meses y pantallas, mejor es el precio unitario."
                }
            },
            {
                "@type": "Question",
                "name": "¿En qué horarios funcionan las pantallas?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Nuestras pantallas funcionan todos los días del año, desde las 7:00 AM hasta las 12:00 AM (medianoche), incluyendo fines de semana y feriados."
                }
            },
            {
                "@type": "Question",
                "name": "¿Puedo cambiar el contenido de mi publicidad durante la campaña?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "¡Claro que sí! Podés actualizar tu spot las veces que necesites durante la campaña sin costo adicional. En menos de 24 horas ya está al aire."
                }
            },
            {
                "@type": "Question",
                "name": "¿Qué tipo de negocios se benefician más con las pantallas LED?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Prácticamente cualquier negocio o marca. Nuestros clientes incluyen inmobiliarias, concesionarias de autos, clínicas, restaurantes, marcas de indumentaria, constructoras, eventos y más."
                }
            },
            {
                "@type": "Question",
                "name": "¿También venden e instalan pantallas LED?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "¡Sí! Además del circuito publicitario, somos proveedores e instaladores de pantallas LED de todo tipo: tótems, pantallas indoor, outdoor y gran formato. Entregamos todo llave en mano con garantía."
                }
            }
        ]
    };

    const faqSchemaScript = document.createElement('script');
    faqSchemaScript.type = 'application/ld+json';
    faqSchemaScript.textContent = JSON.stringify(faqSchema);
    document.head.appendChild(faqSchemaScript);
    // 9. Custom AI Chatbot integration
    const aiChatToggle = document.getElementById('ai-chat-toggle');
    const aiChatWindow = document.getElementById('ai-chat-window');
    const aiChatClose = document.getElementById('ai-chat-close');
    const aiChatForm = document.getElementById('ai-chat-form');
    const aiChatInput = document.getElementById('ai-chat-input');
    const aiChatMessages = document.getElementById('ai-chat-messages');

    if (aiChatToggle && aiChatWindow) {

        let chatHistorySent = false;

        const sendChatHistoryToEmail = () => {
            if (chatHistory.length > 2 && !chatHistorySent) {
                // Formatear el historial
                const formattedHistory = chatHistory.slice(2).map(msg =>
                    `${msg.role === 'user' ? '👤 Usuario' : '🤖 Bot'}: ${msg.parts[0].text}`
                ).join('\n\n');

                const data = {
                    _subject: "Nuevo chat de Bot - AVE FÉNIX LEDS",
                    _template: "table",
                    historial_chat: formattedHistory
                };

                try {
                    // Usar fetch con keepalive: true. Es la forma moderna y más fiable que sendBeacon
                    // para asegurar que la petición se complete incluso si la pestaña se cierra.
                    // Firefox y Chrome soportan esto muy bien con JSON.
                    fetch("/api/public/sitio/avefenix/chat-cierre", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(data),
                        keepalive: true
                    });

                    chatHistorySent = true;
                    console.log("Historial de chat enviado a proceso de email.");
                } catch (error) {
                    console.error("Error al enviar historial:", error);
                }
            }
        };

        const toggleChat = () => {
            const isHidden = aiChatWindow.classList.contains('hidden');
            if (isHidden) {
                // Open chat
                aiChatWindow.classList.remove('hidden');
                // Allow a small delay for display block to apply before animating opacity/transform
                setTimeout(() => {
                    aiChatWindow.classList.remove('opacity-0', 'scale-95');
                    aiChatWindow.classList.add('opacity-100', 'scale-100');
                }, 10);
                aiChatToggle.classList.add('chat-open');
                // Remove notification badge
                const badge = aiChatToggle.querySelector('.animate-ping')?.parentElement;
                if (badge) badge.style.display = 'none';
                setTimeout(() => aiChatInput.focus(), 300);
            } else {
                // Close chat
                aiChatWindow.classList.remove('opacity-100', 'scale-100');
                aiChatWindow.classList.add('opacity-0', 'scale-95');
                aiChatToggle.classList.remove('chat-open');
                setTimeout(() => {
                    aiChatWindow.classList.add('hidden');
                }, 300);

                // Enviar el historial por email al cerrar
                sendChatHistoryToEmail();
            }
        };

        // Capturar cuando el usuario se va de la página
        // visibilitychange es más fiable que beforeunload en navegadores modernos
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                sendChatHistoryToEmail();
            }
        });
        window.addEventListener('beforeunload', () => {
            sendChatHistoryToEmail();
        });

        aiChatToggle.addEventListener('click', toggleChat);
        aiChatClose.addEventListener('click', toggleChat);

        // Chat logic

        const appendUserMessage = (text) => {
            const container = aiChatMessages.querySelector('div');
            const msgHtml = `
                <div class="flex gap-3 max-w-[85%] self-end flex-row-reverse fade-in-up">
                    <div class="bg-primary text-background-dark rounded-2xl rounded-tr-none p-3.5 shadow-lg shadow-primary/10 text-[13px] font-bold leading-relaxed">
                        ${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', msgHtml);
            scrollToBottom();
        };

        const appendAIMessage = (text) => {
            const container = aiChatMessages.querySelector('div');
            const formattedText = text
                .replace(/\* \*\*(.*?)\*\*/g, '<li><strong>$1</strong></li>') // Handle bold lists
                .replace(/\*(.*?)\*/g, '<em>$1</em>') // Handle italics
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Handle bold text
                .replace(/\n\n/g, '</p><p class="mt-2">') // Handle double line breaks
                .replace(/\n/g, '<br>'); // Handle single line breaks

            const msgHtml = `
                <div class="flex gap-2.5 max-w-[90%] fade-in-up">
                    <div class="size-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center mt-1 border border-primary/20">
                        <i data-lucide="bot" class="text-primary size-4"></i>
                    </div>
                    <div class="bg-white/10 border border-white/10 rounded-2xl rounded-tl-none p-3.5 shadow-sm text-[13px] text-slate-100 leading-relaxed chat-ai-response">
                        <p>${formattedText}</p>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', msgHtml);
            lucide.createIcons();
            scrollToBottom();
        };

        const appendTypingIndicator = () => {
            const container = aiChatMessages.querySelector('div');
            const msgHtml = `
                <div id="ai-typing-indicator" class="flex gap-2.5 max-w-[85%] fade-in-up">
                    <div class="size-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center mt-1 border border-primary/20">
                        <i data-lucide="bot" class="text-primary size-4"></i>
                    </div>
                    <div class="bg-white/10 border border-white/10 rounded-2xl rounded-tl-none p-4 shadow-sm flex gap-1.5 items-center justify-center h-10">
                        <div class="size-1.5 bg-primary/80 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div class="size-1.5 bg-primary/80 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div class="size-1.5 bg-primary/80 rounded-full animate-bounce"></div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', msgHtml);
            lucide.createIcons();
            scrollToBottom();
        };

        const removeTypingIndicator = () => {
            const indicator = document.getElementById('ai-typing-indicator');
            if (indicator) indicator.remove();
        };

        const scrollToBottom = () => {
            requestAnimationFrame(() => {
                aiChatMessages.scrollTo({
                    top: aiChatMessages.scrollHeight,
                    behavior: 'smooth'
                });
            });
        };

        // Chat History for context (Aquí es donde entrenas al chatbot)
        let chatHistory = [
            {
                role: "user",
                parts: [{
                    text: `Actúa como el asistente virtual experto de AVE FÉNIX LEDS. Somos líderes en publicidad en pantallas LED (DOOH) en Bahía Blanca. Tenemos circuitos estratégicos (Zelarrayán e Yrigoyen, Teatro Don Bosco, etc). Ayuda a las Pymes y agencias a cotizar campañas publicitarias. Respuestas muy cortas (1-3 oraciones), profesionales pero humanas, y enfocadas en cerrar ventas o redirigir al WhatsApp +54 9 291 412 1109.

--- BASE DE CONOCIMIENTOS (Respuestas predefinidas) ---
Usa esta información exacta para responder a los clientes:

1. Precios base: Desde $XXX.XXX por mes (invitar siempre a consultar por WhatsApp para presupuesto exacto).
2. Formatos que aceptamos: Video MP4 o Imagen JPG de alta calidad.
3. Duración del anuncio: Spots de entre 10 y 15 segundos.
4. Ubicaciones principales: Zelarrayán e Yrigoyen, Teatro Don Bosco, etc.
5. Referente principal: En AVE FÉNIX LEDS trabaja Bruno Corvatta, él es quien maneja todo lo referido a pautas, instalación y colocación de pantallas.
6. Promociones disponibles (invitar siempre a consultar por WhatsApp para los detalles):
   - Hay promoción si eliges 2 o más pantallas.
   - Hay promoción contratando pautas de 3 meses o más.
   - Hay promoción especial pagando por adelantado 3, 6 o 12 meses.
7. Trayectoria y Clientes: Trabajamos con agencias locales, de Buenos Aires e internacionales. ¡Tenemos clientes desde el 2012! Somos la empresa de pantallas LED con más vigencia en Bahía Blanca, nos hemos ganado el respeto y confianza de nuestros clientes.
8. Cambios de spot: Pueden cambiar la pieza publicitaria (el video) las veces que quieran durante el mes sin costo extra.
9. Diseño de video: Si no tienen el diseño armado, nosotros se lo podemos hacer. Que consulten por el servicio de diseño de contenido.
10. Métricas y alcance: Nuestras pantallas operan de 7 AM a 12 de la noche. Tu spot se repite miles de veces, garantizando impactos masivos diarios.
11. Instalación y Venta: Además de comercializar la publicidad, también VENDEMOS E INSTALAMOS pantallas LED en todo el país. Que consulten con Bruno para proyectos llave en mano.
12. Tiempos para salir al aire: Tras enviar el material y avanzar, en menos de 24 horas la pauta ya está subida y visible en Bahía Blanca.

[NOTA PARA EL DUEÑO DE LA WEB: Puedes seguir agregando más preguntas y respuestas comunes aquí mismo para entrenar al bot]` }]
            },
            {
                role: "model",
                parts: [{ text: "¡Entendido! Soy el asistente oficial de AVE FÉNIX LEDS. Resolveré las dudas basándome exactamente en la Base de Conocimientos proporcionada, destacando las métricas, las promos vigentes y dirigiendo a las cotizaciones rápidas por WhatsApp con Bruno Corvatta. Mis respuestas serán cortas (máximo 3 oraciones) y persuasivas." }]
            }
        ];

        aiChatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = aiChatInput.value.trim();
            if (!message) return;

            // UI Updates
            appendUserMessage(message);
            aiChatInput.value = '';
            aiChatInput.disabled = true;
            appendTypingIndicator();

            chatHistory.push({ role: "user", parts: [{ text: message }] });

            try {
                // Resetear la bandera para que si el usuario sigue chateando y vuelve a cerrar, se le envíe el nuevo historial actualizado
                chatHistorySent = false;

                // Call Secure Cloudflare Proxy instead of Gemini directly
                const response = await fetch('/api/public/sitio/avefenix/chat-web', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: chatHistory })
                });

                if (!response.ok) {
                    throw new Error('Error en la API: ' + response.status);
                }

                const data = await response.json();
                const aiResponseText = data.candidates[0].content.parts[0].text;

                chatHistory.push({ role: "model", parts: [{ text: aiResponseText }] });

                removeTypingIndicator();
                appendAIMessage(aiResponseText);
            } catch (error) {
                console.error("Chat Error:", error);
                removeTypingIndicator();
                appendAIMessage("Lo siento, tuve un problema de conexión. ¿Podrías internarlo de nuevo o escribirnos directamente al WhatsApp (+54 9 291 412 1109)?");
            } finally {
                aiChatInput.disabled = false;
                aiChatInput.focus();
            }
        });
    }
});


