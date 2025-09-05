document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO DE LA CONFIGURACIÓN ---
    const selection = {
        phase1: { price: 1200, payment: '2cuotas' },
        phase2: null,
        delivery: false,
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
    const progressSteps = document.querySelectorAll('.progress-step');

    // --- LÓGICA DE NAVEGACIÓN ---
    let currentStep = 1;

    const goToStep = (stepNumber) => {
        steps.forEach(step => step.classList.remove('active-step'));
        document.getElementById(`step-${stepNumber}`).classList.add('active-step');
        currentStep = stepNumber;
        updateNavigation();
        updateSummaryCartVisibility();
        updateProgressBar();
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
            // Lógica condicional para saltar la Fase 3 si no se elige la opción profesional
            if (currentStep === 3 && selection.phase2 && selection.phase2.id !== 'profesional') {
                nextStep = 5; // Saltar a la última página
            }
            goToStep(nextStep);
            updateSummary();
        });
    });
    prevButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            let prevStep = currentStep - 1;
            if (currentStep === 5 && selection.phase2 && selection.phase2.id !== 'profesional') {
                prevStep = 3;
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

        // 2. Costo del proyecto (Fase 1 + Fase 2)
        const phase2Input = document.querySelector('input[name="phase2"]:checked');
        let totalProjectCost = selection.phase1.price;
        let monthlyCost = 150; // Base
        let addonsCost = 0; // Costo de addons
        let addonsMonthlyCost = 0; // Costo mensual de addons

        // Reseteamos y guardamos el estado de fase 2
        selection.phase2 = null;
        if (phase2Input) {
            selection.phase2 = { id: phase2Input.value, name: phase2Input.closest('.plan-card').querySelector('h3').textContent, price: parseFloat(phase2Input.dataset.price) };
            totalProjectCost += selection.phase2.price;
        }

        // 3. Módulos Adicionales (Fase 3) - Lógica mejorada para múltiples addons
        const addonInputs = document.querySelectorAll('input[name="addons"]');
        selection.addons = []; // Limpiamos para reconstruir la selección

        addonInputs.forEach(input => {
            // Si el plan "Profesional" no está seleccionado, desmarcamos y deshabilitamos todos los addons
            if (!selection.phase2 || selection.phase2.id !== 'profesional') {
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
                    addonsCost += price;
                    addonsMonthlyCost += monthlyPrice;
                    selection.addons.push({
                        name: input.closest('.addon-card').querySelector('h4').textContent,
                        price: price
                    });
                }
            }
        });

        totalProjectCost += addonsCost;
        monthlyCost += addonsMonthlyCost;

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
                summaryHTML += `<p class="pl-4 text-sm">&#9679; ${addon.name} (+${formatCurrency(addon.price)})</p>`;
            });
        }
        summaryHTML += `<p class="mt-4 border-t border-gray-600 pt-4"><strong class="text-green-400">Inversión Total del Proyecto:</strong> ${formatCurrency(totalProjectCost)}</p>`;
        summaryHTML += `<p class="mt-2"><strong class="text-cyan-400">Servicio Mensual Total:</strong> ${formatCurrency(monthlyCost)}</p>`;
        finalSummaryEl.innerHTML = summaryHTML;
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

    goToStep(1);
    initializeSelections(); // Llama a la función para establecer el estado visual inicial
    updateSummary();
});