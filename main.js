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
        
        // 2. Costo total del proyecto (Fase 1 + Fase 2 + Delivery)
        const phase2Input = document.querySelector('input[name="phase2"]:checked');
        let totalProjectCost = selection.phase1.price;
        let monthlyCost = 150; // Base
        
        if (phase2Input) {
            selection.phase2 = { id: phase2Input.value, name: phase2Input.closest('.plan-card').querySelector('h3').textContent, price: parseFloat(phase2Input.dataset.price) };
            totalProjectCost += selection.phase2.price;
        } else {
            selection.phase2 = null;
            // Ya no es necesario manipular el display aquí, la navegación se encarga.
        }

        // 3. Módulo de Delivery
        const deliveryInput = document.getElementById('addon-delivery');
        selection.delivery = deliveryInput.checked;
        if (selection.delivery && selection.phase2 && selection.phase2.id === 'profesional') {
            totalProjectCost += parseFloat(deliveryInput.dataset.price);
            monthlyCost += parseFloat(deliveryInput.dataset.monthlyPrice);
        } else {
            deliveryInput.checked = false; // Desmarcar si no es profesional
        }
        
        // Actualizar UI
        animateUpdate(totalInicialEl, formatCurrency(initialPayment));
        animateUpdate(totalProyectoEl, formatCurrency(totalProjectCost));
        animateUpdate(totalMensualEl, formatCurrency(monthlyCost));

        // Actualizar resumen final
        let summaryHTML = `<p><strong class="text-purple-400">Fase 1:</strong> Lanzamiento Piloto (${formatCurrency(selection.phase1.price)})</p>
                           <p class="pl-4 text-sm"><strong class="text-yellow-400">Pago Inicial:</strong> ${formatCurrency(initialPayment)}</p>`;
        if (selection.phase2) {
             summaryHTML += `<p class="mt-4"><strong class="text-purple-400">Fase 2 (Seleccionada):</strong> ${selection.phase2.name} (+${formatCurrency(selection.phase2.price)})</p>`;
        }
        if (selection.delivery && selection.phase2.id === 'profesional') {
             summaryHTML += `<p class="mt-4"><strong class="text-purple-400">Fase 3 (Seleccionada):</strong> Módulo Delivery (+${formatCurrency(deliveryInput.dataset.price)})</p>`;
        }
        summaryHTML += `<p class="mt-4"><strong class="text-purple-400">Servicio Mensual Total:</strong> ${formatCurrency(monthlyCost)}</p>`;
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
    document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', () => {
            if (input.type === 'radio') {
                document.querySelectorAll(`input[name="${input.name}"]`).forEach(radio => {
                    radio.closest('.plan-card').classList.remove('selected');
                });
                input.closest('.plan-card').classList.add('selected');
            } else {
                 input.closest('.addon-card').classList.toggle('selected', input.checked);
            }
            updateSummary();
        });
    });
    
    goToStep(1);
    // Ya no es necesario ocultar el paso de delivery aquí.
    updateSummary();
});