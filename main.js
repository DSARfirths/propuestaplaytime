document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO DE LA CONFIGURACIÓN ---
    const selection = {
        phase1: {
            price: 1200,
            payment: '2cuotas'
        },
        phase2: null,
    };

    // --- ELEMENTOS DEL DOM ---
    const steps = document.querySelectorAll('.step');
    const nextButtons = document.querySelectorAll('.next-btn');
    const prevButtons = document.querySelectorAll('.prev-btn');
    const summaryCart = document.getElementById('summary-cart');
    const totalInicialEl = document.getElementById('total-inicial');
    const totalProyectoEl = document.getElementById('total-proyecto');
    const finalSummaryEl = document.getElementById('final-summary');

    // --- LÓGICA DE NAVEGACIÓN ---
    let currentStep = 1;

    const goToStep = (stepNumber) => {
        steps.forEach(step => step.classList.remove('active-step'));
        document.getElementById(`step-${stepNumber}`).classList.add('active-step');
        currentStep = stepNumber;
        updateNavigation();
        updateSummaryCartVisibility();
    };
    
    const updateNavigation = () => {
        const prevBtn = document.querySelector(`#step-${currentStep} ~ .step-navigation .prev-btn`);
        const nextBtn = document.querySelector(`#step-${currentStep} ~ .step-navigation .next-btn`);
        if (prevBtn) prevBtn.style.display = currentStep > 1 ? 'inline-block' : 'none';
        if (nextBtn) nextBtn.style.display = currentStep < steps.length ? 'inline-block' : 'none';
    };

    nextButtons.forEach(btn => {
        btn.addEventListener('click', () => goToStep(parseInt(btn.dataset.next) || currentStep + 1));
    });
    prevButtons.forEach(btn => {
        btn.addEventListener('click', () => goToStep(currentStep - 1));
    });

    // --- LÓGICA DE CÁLCULO Y ACTUALIZACIÓN ---
    const formatCurrency = (value) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);

    const updateSummary = () => {
        // 1. Costo inicial (Fase 1)
        const paymentPhase1 = document.querySelector('input[name="payment_phase1"]:checked').value;
        selection.phase1.payment = paymentPhase1;
        const initialPayment = paymentPhase1 === '2cuotas' ? selection.phase1.price / 2 : selection.phase1.price;
        
        // 2. Costo total del proyecto (Fase 1 + Fase 2)
        const phase2Input = document.querySelector('input[name="phase2"]:checked');
        let totalProjectCost = selection.phase1.price;
        if (phase2Input) {
            selection.phase2 = { id: phase2Input.value, name: phase2Input.closest('.plan-card').querySelector('h3').textContent, price: parseFloat(phase2Input.dataset.price) };
            totalProjectCost += selection.phase2.price;
        } else {
            selection.phase2 = null; // Si no hay nada seleccionado
        }

        // Actualizar UI del carrito flotante
        totalInicialEl.textContent = formatCurrency(initialPayment);
        totalProyectoEl.textContent = formatCurrency(totalProjectCost);

        // Actualizar resumen final en el último paso
        let summaryHTML = `<p><strong class="text-purple-400">Fase 1:</strong> Lanzamiento Piloto (${formatCurrency(selection.phase1.price)})</p>
                           <p class="pl-4 text-sm"><strong class="text-yellow-400">Pago Inicial:</strong> ${formatCurrency(initialPayment)}</p>`;
        if (selection.phase2) {
             summaryHTML += `<p class="mt-4"><strong class="text-purple-400">Fase 2 (Estimada):</strong> ${selection.phase2.name} (+${formatCurrency(selection.phase2.price)})</p>`;
        }
        summaryHTML += `<p class="mt-4"><strong class="text-purple-400">Servicio Mensual:</strong> ${formatCurrency(150)}</p>`;
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
    document.querySelectorAll('input[type="radio"]').forEach(input => {
        input.addEventListener('change', () => {
            if (input.name.startsWith('phase')) {
                 document.querySelectorAll(`input[name="${input.name}"]`).forEach(radio => {
                    radio.closest('.plan-card').classList.remove('selected');
                });
                input.closest('.plan-card').classList.add('selected');
            }
            updateSummary();
        });
    });
    
    goToStep(1);
    updateSummary(); // Calcular totales iniciales
});