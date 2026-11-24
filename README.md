# En fase · Laboratorio PLL

Aplicación didáctica interactiva del Tema 5 de CSAF. Incluye la arquitectura del PLL, una respuesta temporal linealizada, las transferencias de fase de referencia y VCO y una comparación de detectores ideales de tipo multiplicador, XOR y PFD con bomba de carga.

El modelo de segundo orden y tipo II representa pequeñas perturbaciones alrededor del enganche. La referencia se compara con la fase de salida dividida por N. El desajuste inicial mostrado corresponde al VCO sin dividir y el salto ocurre en la referencia a los 30 µs. No representa captura global, límites de sintonía, conmutación ni deslizamientos de ciclo. La indicación de tolerancia es instantánea al final de la simulación.

Las curvas de ruido muestran ganancias de transferencia, no espectros absolutos. La referencia incluye N² en potencia. Los detectores se comparan con señales periódicas ideales de igual frecuencia y cada curva tiene su propia normalización. Las fuentes se indican en la propia web.

Para ejecutar la vista local usa `npm start` y abre http://127.0.0.1:4174. Las pruebas del modelo se ejecutan con `npm test`. No hay dependencias externas.

La vista temporal permite reproducir, pausar y recorrer el enganche. Los fasores muestran el error de fase calculado con una ampliación angular ajustable indicada en pantalla, limitada para que el ángulo visual no supere 83° y su giro es esquemático. Un cursor sigue la misma simulación en las gráficas de frecuencia y error.

La primera vista incluye un recorrido visual por detector, filtro, VCO y divisor. Los trazos y el cursor son esquemáticos. El divisor representa N ciclos por cada periodo de referencia cuando el lazo está enganchado.

La vista del lazo conecta las cuatro etapas mediante un modelo visual normalizado único, independiente del modelo lineal de enganche. El ejemplo de ruido suma contribuciones de referencia y VCO no correlacionadas, y el PFD muestra pulsos ideales con frecuencias impuestas. Los tres son modelos didácticos, sin validación física.

La primera pestaña presenta la equivalencia entre el PLL de segundo orden y un PI normalizado con planta de fase 1/s. La salida de esa planta es la fase dividida. Las ganancias están absorbidas en el modelo y la ecuación del controlador no se atribuye directamente al filtro físico.

El juego de sincronización ilustra la comparación de fase y el control manual de un oscilador con frecuencia variable. Ambos péndulos representan señales sinusoidales de frecuencia impuesta. La puntuación combina tolerancias de fase y frecuencia y es un criterio del juego.

Durante la partida se registran el error de fase envuelto y las frecuencias de referencia y del jugador. Las gráficas muestran el intervalo de 45 segundos y conservan el historial al pausar.
