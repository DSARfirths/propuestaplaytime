document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO DE LA CONFIGURACIÓN ---
    const selection = {
        phase1: { price: 1200, payment: '2cuotas' },
        phase2: null,
        isFinanced: false,
    };

    // --- ELEMENTOS DEL DOM ---
    const steps = document.querySelectorAll('.step');
    const nextButtons = document.querySelectorAll('.next-btn');
    const prevButtons = document.querySelectorAll('.prev-btn');
    const summaryCart = document.getElementById('summary-cart');
    const totalInicialEl = document.getElementById('total-inicial');
    const totalProyectoEl = document.getElementById('total-proyecto');
    const totalMensualEl = document.getElementById('total-mensual');
    const finalSummaryEl = document.getElementById('final-summary');
    const deliveryStep = document.getElementById('step-4');
    const approveBtn = document.getElementById('approve-btn');
    const progressSteps = document.querySelectorAll('.progress-step');
    const financingToggle = document.getElementById('financing-toggle');
    const nextStepsEl = document.getElementById('next-steps-summary');
    const financingExplanation = document.getElementById('financing-explanation');

    // --- ELEMENTOS DE AUDIO ---
    const clickSound = document.getElementById('sound-click');
    const selectSound = document.getElementById('sound-select');
    const nextStepSound = document.getElementById('sound-next-step');
    const approveSound = document.getElementById('sound-approve');

    const playSound = (audioElement) => {
        if (!audioElement) return;
        audioElement.currentTime = 0;
        audioElement.play().catch(e => console.error("Error al reproducir sonido:", e));
    };

    // --- LÓGICA DE NAVEGACIÓN ---
    let currentStep = 1;

    const goToStep = (stepNumber) => {
        steps.forEach(step => step.classList.remove('active-step'));
        document.getElementById(`step-${stepNumber}`).classList.add('active-step');
        currentStep = stepNumber;
        updateNavigation();
        updateSummaryCartVisibility();
        updateProgressBar();

        // Si vamos al paso 5, deshabilitamos el botón de aprobar inicialmente
        if (stepNumber === 6) {
            approveBtn.classList.add('disabled');
            nextStepsEl.scrollTop = 0; // Reinicia el scroll al principio
        }
    };

    const updateNavigation = () => {
        const prevBtn = document.querySelector(`#step-${currentStep} .prev-btn`);
        const nextBtn = document.querySelector(`#step-${currentStep} .next-btn`);
        if (prevBtn) prevBtn.style.display = currentStep > 1 ? 'inline-block' : 'none';
        if (nextBtn) nextBtn.style.display = currentStep < steps.length ? 'inline-block' : 'none';
    };

    const updateProgressBar = () => {
        progressSteps.forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            if (stepNum === currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else if (stepNum < currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
    };

    nextButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            let nextStep = parseInt(btn.dataset.next) || currentStep + 1;
            playSound(nextStepSound);
            // Lógica condicional para saltar la Fase 3 si no se elige una opción con integración POS
            const phase2UnlocksAddons = selection.phase2 && (selection.phase2.id === 'profesional' || selection.phase2.id === 'legendaria');
            if (currentStep === 3 && !phase2UnlocksAddons) { // Salta de Fase 2 a Servicio
                nextStep = 5; // Saltar a la última página
            }
            goToStep(nextStep);
            updateSummary();
        });
    });

    prevButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            let prevStep = currentStep - 1;
            playSound(clickSound);
            const phase2UnlocksAddons = selection.phase2 && (selection.phase2.id === 'profesional' || selection.phase2.id === 'legendaria');
            if (currentStep === 5 && !phase2UnlocksAddons) { // Vuelve de Servicio a Fase 2
                prevStep = 3; // Saltar hacia atrás a la Fase 2
            }
            goToStep(prevStep);
        });
    });

    // --- LÓGICA DE CÁLCULO Y ACTUALIZACIÓN ---
    const formatCurrency = (value) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);

    const animateUpdate = (element, newValue) => {
        // Solo animar si el valor realmente cambia para evitar flashes innecesarios
        if (element.textContent !== newValue) {
            element.classList.add('value-updated');
            element.textContent = newValue;
            // Eliminar la clase después de la animación para que pueda volver a ejecutarse
            element.addEventListener('animationend', () => {
                element.classList.remove('value-updated');
            }, { once: true }); // La opción 'once' es clave para que el listener se autolimpie
        }
    };

    const updateSummary = () => {
        // 1. Costo inicial (Fase 1)
        const paymentPhase1 = document.querySelector('input[name="payment_phase1"]:checked').value;
        selection.phase1.payment = paymentPhase1;
        const initialPayment = paymentPhase1 === '2cuotas' ? selection.phase1.price / 2 : selection.phase1.price;

        // Verificamos el estado del financiamiento
        selection.isFinanced = financingToggle.checked;
        financingExplanation.style.display = selection.isFinanced ? 'block' : 'none';

        // 2. Costo del proyecto (Fase 1 + Fase 2)
        const phase2Input = document.querySelector('input[name="phase2"]:checked');
        let totalProjectCost = selection.phase1.price;
        let monthlyCost = 150; // Base
        let addonsCost = 0; // Costo de addons
        let addonsMonthlyCost = 0; // Costo mensual de addons
        let financedAmount = 0; // Monto de Fase 2 y 3 que se financiará
        let monthlyFinancedPayment = 0;

        // Reseteamos y guardamos el estado de fase 2
        selection.phase2 = null;
        if (phase2Input) {
            const phase2Price = parseFloat(phase2Input.dataset.price);
            selection.phase2 = { id: phase2Input.value, name: phase2Input.closest('.plan-card').querySelector('h3').textContent, price: phase2Price };
            if (selection.isFinanced) financedAmount += phase2Price;
            else totalProjectCost += phase2Price;
        }

        // 3. Módulos Adicionales (Fase 3) - Lógica mejorada para múltiples addons
        const addonInputs = document.querySelectorAll('input[name="addons"]');
        selection.addons = []; // Limpiamos para reconstruir la selección

        addonInputs.forEach(input => {
            // Si no se ha seleccionado un plan que desbloquee addons (Profesional o Legendaria), los deshabilitamos
            const addonsEnabled = selection.phase2 && (selection.phase2.id === 'profesional' || selection.phase2.id === 'legendaria');
            if (!addonsEnabled) {
                input.checked = false;
                input.disabled = true;
                input.closest('.addon-card').classList.add('opacity-50', 'cursor-not-allowed');
                input.closest('.addon-card').classList.remove('selected');
            } else {
                // Si el plan es profesional, los habilitamos
                input.disabled = false;
                input.closest('.addon-card').classList.remove('opacity-50', 'cursor-not-allowed');

                if (input.checked) {
                    const price = parseFloat(input.dataset.price) || 0;
                    const monthlyPrice = parseFloat(input.dataset.monthlyPrice) || 0;
                    if (selection.isFinanced) financedAmount += price;
                    else addonsCost += price;
                    addonsMonthlyCost += monthlyPrice;
                    selection.addons.push({
                        name: input.closest('.addon-card').querySelector('h4').textContent,
                        price: price,
                        monthlyPrice: monthlyPrice
                    });
                }
            }
        });

        if (selection.isFinanced && financedAmount > 0) {
            const totalFinanced = financedAmount * 1.20; // Se aplica un 20% de interés
            monthlyFinancedPayment = totalFinanced / 12;
        }

        totalProjectCost += addonsCost;
        monthlyCost += addonsMonthlyCost;
        monthlyCost += monthlyFinancedPayment;

        // 4. Actualizar UI
        animateUpdate(totalInicialEl, formatCurrency(initialPayment));
        animateUpdate(totalProyectoEl, formatCurrency(totalProjectCost));
        animateUpdate(totalMensualEl, formatCurrency(monthlyCost));

        // 5. Actualizar resumen final en la última página
        let summaryHTML = `<p><strong class="text-purple-400">Fase 1:</strong> Lanzamiento Piloto (${formatCurrency(selection.phase1.price)})</p>
                       <p class="pl-4 text-sm"><strong class="text-yellow-400">Pago Inicial:</strong> ${formatCurrency(initialPayment)}</p>`;
        if (selection.phase2) {
            summaryHTML += `<p class="mt-4"><strong class="text-purple-400">Fase 2:</strong> ${selection.phase2.name} (+${formatCurrency(selection.phase2.price)})</p>`;
        }
        if (selection.addons.length > 0) {
            summaryHTML += `<p class="mt-4"><strong class="text-purple-400">Fase 3 (Módulos):</strong></p>`;
            selection.addons.forEach(addon => {
                let addonText = `&#9679; ${addon.name}`;
                if (selection.isFinanced) {
                    if (addon.price > 0) addonText += ` (financiado)`;
                } else { addonText += ` (+${formatCurrency(addon.price)})`; }
                summaryHTML += `<p class="pl-4 text-sm">${addonText}</p>`;
            });
        }
        summaryHTML += `<p class="mt-4 border-t border-gray-600 pt-4"><strong class="text-green-400">Inversión Total del Proyecto:</strong> ${formatCurrency(totalProjectCost)}</p>`;
        
        // Desglose del costo mensual
        summaryHTML += `<div class="mt-2 pt-2 border-t border-gray-700">`;
        summaryHTML += `<p><strong class="text-cyan-400">Desglose Mensual:</strong></p>`;
        summaryHTML += `<ul class="list-none pl-4 text-sm space-y-1 mt-2">`;
        summaryHTML += `<li><span>Servicio Base (Hosting y Soporte):</span><span class="float-right">${formatCurrency(150)}</span></li>`;
        if (addonsMonthlyCost > 0) {
            summaryHTML += `<li><span>Costo Mensual Módulos:</span><span class="float-right">${formatCurrency(addonsMonthlyCost)}</span></li>`;
        }
        if (monthlyFinancedPayment > 0) {
            summaryHTML += `<li><span>Cuota de Financiamiento (12 meses):</span><span class="float-right">${formatCurrency(monthlyFinancedPayment)}</span></li>`;
        }
        summaryHTML += `</ul>`;
        summaryHTML += `<p class="mt-2 border-t border-gray-600 pt-2"><strong class="text-cyan-400">Servicio Mensual Total:</strong><span class="float-right font-bold text-lg">${formatCurrency(monthlyCost)}</span></p>`;
        summaryHTML += `</div>`;

        finalSummaryEl.innerHTML = summaryHTML;
        
        // 6. Actualizar sección de Próximos Pasos y Términos
        let termsHTML = `<ul class="list-disc list-inside space-y-2">`;
        termsHTML += `<li><strong>Inicio y Tiempos:</strong> Para iniciar la <strong>Fase 1</strong>, se requiere el pago inicial de <strong>${formatCurrency(initialPayment)}</strong>. El tiempo de entrega estimado es de 3-5 días hábiles.</li>`;
        
        if (selection.phase2) {
            const isPosIntegration = selection.phase2.id === 'profesional' || selection.phase2.id === 'legendaria';
            if (isPosIntegration) {
                termsHTML += `<li><strong>Fase 2 con Integración:</strong> La opción <strong>${selection.phase2.name}</strong> requiere una coordinación y un pago de S/ 1,500 directamente a BrainPOS. El tiempo de desarrollo para esta fase es de 10-15 días hábiles post-Fase 1.</li>`;
            } else {
                termsHTML += `<li><strong>Fase 2 sin Integración:</strong> La opción <strong>${selection.phase2.name}</strong> se implementará en un estimado de 5-7 días hábiles post-Fase 1.</li>`;
            }
        }

        if (selection.isFinanced) {
            termsHTML += `<li class="text-yellow-300"><strong>Financiamiento:</strong> Al activar esta opción, los costos de Fase 2 y 3 se dividen en 12 cuotas. El no pago de 2 cuotas consecutivas resultará en la suspensión temporal del servicio.</li>`;
        }

        if (selection.addons.length > 0) {
            termsHTML += `<li><strong>Módulos Adicionales:</strong> La implementación de los módulos de Fase 3 comenzará tras completar la Fase 2. Cada módulo tiene un tiempo de desarrollo de 5-7 días hábiles.</li>`;
        }

        termsHTML += `<li><strong>Servicio Mensual:</strong> El servicio mensual cubre hosting, mantenimiento, seguridad y soporte. Puede ser cancelado con 30 días de antelación. La cancelación no exime los pagos de financiamiento pendientes.</li>`;
        termsHTML += `<li><strong>Propiedad Intelectual:</strong> Al finalizar todos los pagos del proyecto, ustedes serán dueños del diseño, contenido y datos de clientes. Yo conservaré los derechos sobre el código base y la tecnología subyacente para futuros proyectos.</li>`;
        termsHTML += `<li><strong>Validez:</strong> Esta propuesta tiene una validez de 15 días.</li>`;
        termsHTML += `</ul>`;
        nextStepsEl.innerHTML = termsHTML;


        // 7. Actualizar el enlace de WhatsApp del botón de aprobación
        const phoneNumber = "51924281623"; // Número sin +, espacios ni guiones
        let messageBody = `Hola, confirmo la aprobación de la propuesta *Play Time-Resto Gamer* con la siguiente configuración (${selection.isFinanced ? "CON financiamiento" : "SIN financiamiento"}):\n\n`;
        
        messageBody += `*--- FASE 1: Lanzamiento Piloto ---*\n`;
        messageBody += `Inversión: ${formatCurrency(selection.phase1.price)}\n`;
        const paymentText = selection.phase1.payment === '2cuotas' ? '2 cuotas' : '1 pago único';
        messageBody += `Modalidad de Pago: ${paymentText}\n\n`;

        if (selection.phase2) {
            messageBody += `*--- FASE 2: Expansión ---*\n`;
            messageBody += `Opción: ${selection.phase2.name}\n`;
            messageBody += `Costo Adicional: ${formatCurrency(selection.phase2.price)}\n\n`;
        }

        if (selection.addons.length > 0) {
            messageBody += `*--- FASE 3: Módulos Adicionales ---*\n`;
            selection.addons.forEach(addon => {
                let addonText = `- ${addon.name}`;
                if (selection.isFinanced) {
                    if (addon.price > 0) addonText += ` (financiado)`;
                } else { addonText += ` (+${formatCurrency(addon.price)})`; }
                messageBody += `${addonText}\n`;
            });
            messageBody += `\n`;
        }

        messageBody += `------------------------------------\n`;
        messageBody += `*RESUMEN DE COSTOS:*\n`;
        messageBody += `*Inversión Total del Proyecto:* ${formatCurrency(totalProjectCost)}\n`;
        messageBody += `*Servicio Mensual Total:* ${formatCurrency(monthlyCost)}`;
        // Añadir desglose al mensaje de WhatsApp
        if (addonsMonthlyCost > 0 || monthlyFinancedPayment > 0) {
            messageBody += ` (Desglose:`;
            messageBody += ` Base ${formatCurrency(150)}`;
            if (addonsMonthlyCost > 0) messageBody += ` + Módulos ${formatCurrency(addonsMonthlyCost)}`;
            if (monthlyFinancedPayment > 0) messageBody += ` + Financ. ${formatCurrency(monthlyFinancedPayment)}`;
            messageBody += `)`;
        }
        messageBody += `\n`;

        messageBody += `------------------------------------\n\n`;
        messageBody += `Quedo a la espera de los siguientes pasos. ¡Gracias!`;

        approveBtn.href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(messageBody)}`;
    };

    const updateSummaryCartVisibility = () => {
        if (currentStep > 1) {
            summaryCart.classList.add('visible');
        } else {
            summaryCart.classList.remove('visible');
        }
    };

    // --- INICIALIZACIÓN ---
    const initializeSelections = () => {
        // Asegura que el estado visual inicial coincida con los inputs 'checked'
        document.querySelectorAll('input[type="radio"]:checked').forEach(input => {
            if (input.closest('.plan-card')) {
                input.closest('.plan-card').classList.add('selected');
            }
            if (input.closest('.payment-option')) {
                input.closest('.payment-option').classList.add('selected');
            }
        });
    };

    document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', () => {
            playSound(selectSound);
            if (input.type === 'radio') {
                document.querySelectorAll(`input[name="${input.name}"]`).forEach(radio => {
                    radio.closest('.plan-card, .payment-option')?.classList.remove('selected');
                });
                input.closest('.plan-card, .payment-option')?.classList.add('selected');
            } else {
                input.closest('.addon-card').classList.toggle('selected', input.checked);
            }
            updateSummary();
        });
    });

    financingToggle.addEventListener('change', () => {
        playSound(selectSound);
        updateSummary();
    });

    // Lógica para colapsar/expandir el carrito en móvil
    const summaryCartHeader = document.getElementById('summary-cart-header');
    summaryCartHeader.addEventListener('click', () => {
        playSound(clickSound);
        summaryCart.classList.toggle('expanded');
    });

    // Lógica para habilitar el botón de aprobación al hacer scroll en los términos
    nextStepsEl.addEventListener('scroll', () => {
        // Se da un pequeño margen de 1px para evitar problemas de redondeo en algunos navegadores
        const isScrolledToEnd = nextStepsEl.scrollHeight - nextStepsEl.scrollTop <= nextStepsEl.clientHeight + 1;
        if (isScrolledToEnd) {
            approveBtn.classList.remove('disabled');
        }
    });

    approveBtn.addEventListener('click', () => {
        playSound(approveSound);
    });

    // Lógica para desplegables de características en Fase 2
    document.querySelectorAll('.details-toggle-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            playSound(clickSound);
            e.preventDefault(); // Evita que el click en el botón active el radio de la tarjeta
            const details = button.nextElementSibling;
            const arrow = button.querySelector('.arrow');
            if (details.style.maxHeight) {
                details.style.maxHeight = null;
                arrow.style.transform = 'rotate(0deg)';
            } else {
                details.style.maxHeight = details.scrollHeight + "px";
                arrow.style.transform = 'rotate(180deg)';
            }
        });
    });

    goToStep(1);
    initializeSelections(); // Llama a la función para establecer el estado visual inicial
    updateSummary();
});