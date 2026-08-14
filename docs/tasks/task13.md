
contexte : la gestion des promotions ( class) est un element clee de l app 

l interface: apps\web\src\app\(app)\[slug]\direction\academic\promotions\page.tsx

est le point d entrer de la direction a la gestion des promotions 

tache : promprose des amelioration pour la page :apps\web\src\app\(app)\[slug]\direction\academic\promotions\page.tsx

NB: 
-s'assurer de lire claude.md racine et inclure dans le plan les worflow de patern adapter pr la tache 

ex:  pour la recherche rapide des fn se baser sur ./api et /summary referncer dans claude.md (racine) inclure les script et patern juger utile a la tache dans le plan pr ne pas perdre le contexte , ect 

-utiliser le skill :docs\cmd\por-dev.md pour etabir le plan
-se baser sur docs\visions pour comprendre les besoin des interfaces surlequels tu travail (la structure des pages de visions sert de repert produit elle n est pas a suivre a la lettre )



Console Error



The final argument passed to useEffect changed size between renders. The order and size of this array must remain constant.

Previous: []
Incoming: [class PointerSensor extends AbstractPointerSensor {
    constructor(props){
        const { event } = props; // Pointer events stop firing if the target is unmounted while dragging
        // Therefore we attach listeners to the owner document instead
        const listenerTarget = (0, {imported module ./nodemodules/.bun/@dnd-kit+utilities@3.2.2+b1ab299f0a400331/nodemodules/@dnd-kit/utilities/dist/utilities.esm.js}["getOwnerDocument"])(event.target);
        super(props, events, listenerTarget);
    }
}, class TouchSensor extends AbstractPointerSensor {
    constructor(props){
        super(props, events$2);
    }
    static setup() {
        // Adding a non-capture and non-passive `touchmove` listener in order
        // to force `event.preventDefault()` calls to work in dynamically added
        // touchmove event handlers. This is required for iOS Safari.
        window.addEventListener(events$2.move.name, noop, {
            capture: false,
            passive: false
        });
        return function teardown() {
            window.removeEventListener(events$2.move.name, noop);
        }; // We create a new handler because the teardown function of another sensor
        //TURBOPACK unreachable
        ;
        // could remove our event listener if we use a referentially equal listener.
        function noop() {}
    }
}, class KeyboardSensor {
    constructor(props){
        this.props = void 0;
        this.autoScrollEnabled = false;
        this.referenceCoordinates = void 0;
        this.listeners = void 0;
        this.windowListeners = void 0;
        this.props = props;
        const { event: { target } } = props;
        this.props = props;
        this.listeners = new Listeners((0, {imported module ./nodemodules/.bun/@dnd-kit+utilities@3.2.2+b1ab299f0a400331/nodemodules/@dnd-kit/utilities/dist/utilities.esm.js}["getOwnerDocument"])(target));
        this.windowListeners = new Listeners((0, {imported module ./nodemodules/.bun/@dnd-kit+utilities@3.2.2+b1ab299f0a400331/nodemodules/@dnd-kit/utilities/dist/utilities.esm.js}["getWindow"])(target));
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.attach();
    }
    attach() {
        this.handleStart();
        this.windowListeners.add(EventName.Resize, this.handleCancel);
        this.windowListeners.add(EventName.VisibilityChange, this.handleCancel);
        setTimeout(()=>this.listeners.add(EventName.Keydown, this.handleKeyDown));
    }
    handleStart() {
        const { activeNode, onStart } = this.props;
        const node = activeNode.node.current;
        if (node) {
            scrollIntoViewIfNeeded(node);
        }
        onStart(defaultCoordinates);
    }
    handleKeyDown(event) {
        if ((0, {imported module ./nodemodules/.bun/@dnd-kit+utilities@3.2.2+b1ab299f0a400331/nodemodules/@dnd-kit/utilities/dist/utilities.esm.js}["isKeyboardEvent"])(event)) {
            const { active, context, options } = this.props;
            const { keyboardCodes = defaultKeyboardCodes, coordinateGetter = defaultKeyboardCoordinateGetter, scrollBehavior = 'smooth' } = options;
            const { code } = event;
            if (keyboardCodes.end.includes(code)) {
                this.handleEnd(event);
                return;
            }
            if (keyboardCodes.cancel.includes(code)) {
                this.handleCancel(event);
                return;
            }
            const { collisionRect } = context.current;
            const currentCoordinates = collisionRect ? {
                x: collisionRect.left,
                y: collisionRect.top
            } : defaultCoordinates;
            if (!this.referenceCoordinates) {
                this.referenceCoordinates = currentCoordinates;
            }
            const newCoordinates = coordinateGetter(event, {
                active,
                context: context.current,
                currentCoordinates
            });
            if (newCoordinates) {
                const coordinatesDelta = (0, {imported module ./nodemodules/.bun/@dnd-kit+utilities@3.2.2+b1ab299f0a400331/nodemodules/@dnd-kit/utilities/dist/utilities.esm.js}["subtract"])(newCoordinates, currentCoordinates);
                const scrollDelta = {
                    x: 0,
                    y: 0
                };
                const { scrollableAncestors } = context.current;
                for (const scrollContainer of scrollableAncestors){
                    const direction = event.code;
                    const { isTop, isRight, isLeft, isBottom, maxScroll, minScroll } = getScrollPosition(scrollContainer);
                    const scrollElementRect = getScrollElementRect(scrollContainer);
                    const clampedCoordinates = {
                        x: Math.min(direction === KeyboardCode.Right ? scrollElementRect.right - scrollElementRect.width / 2 : scrollElementRect.right, Math.max(direction === KeyboardCode.Right ? scrollElementRect.left : scrollElementRect.left + scrollElementRect.width / 2, newCoordinates.x)),
                        y: Math.min(direction === KeyboardCode.Down ? scrollElementRect.bottom - scrollElementRect.height / 2 : scrollElementRect.bottom, Math.max(direction === KeyboardCode.Down ? scrollElementRect.top : scrollElementRect.top + scrollElementRect.height / 2, newCoordinates.y))
                    };
                    const canScrollX = direction === KeyboardCode.Right && !isRight || direction === KeyboardCode.Left && !isLeft;
                    const canScrollY = direction === KeyboardCode.Down && !isBottom || direction === KeyboardCode.Up && !isTop;
                    if (canScrollX && clampedCoordinates.x !== newCoordinates.x) {
                        const newScrollCoordinates = scrollContainer.scrollLeft + coordinatesDelta.x;
                        const canScrollToNewCoordinates = direction === KeyboardCode.Right && newScrollCoordinates <= maxScroll.x || direction === KeyboardCode.Left && newScrollCoordinates >= minScroll.x;
                        if (canScrollToNewCoordinates && !coordinatesDelta.y) {
                            // We don't need to update coordinates, the scroll adjustment alone will trigger
                            // logic to auto-detect the new container we are over
                            scrollContainer.scrollTo({
                                left: newScrollCoordinates,
                                behavior: scrollBehavior
                            });
                            return;
                        }
                        if (canScrollToNewCoordinates) {
                            scrollDelta.x = scrollContainer.scrollLeft - newScrollCoordinates;
                        } else {
                            scrollDelta.x = direction === KeyboardCode.Right ? scrollContainer.scrollLeft - maxScroll.x : scrollContainer.scrollLeft - minScroll.x;
                        }
                        if (scrollDelta.x) {
                            scrollContainer.scrollBy({
                                left: -scrollDelta.x,
                                behavior: scrollBehavior
                            });
                        }
                        break;
                    } else if (canScrollY && clampedCoordinates.y !== newCoordinates.y) {
                        const newScrollCoordinates = scrollContainer.scrollTop + coordinatesDelta.y;
                        const canScrollToNewCoordinates = direction === KeyboardCode.Down && newScrollCoordinates <= maxScroll.y || direction === KeyboardCode.Up && newScrollCoordinates >= minScroll.y;
                        if (canScrollToNewCoordinates && !coordinatesDelta.x) {
                            // We don't need to update coordinates, the scroll adjustment alone will trigger
                            // logic to auto-detect the new container we are over
                            scrollContainer.scrollTo({
                                top: newScrollCoordinates,
                                behavior: scrollBehavior
                            });
                            return;
                        }
                        if (canScrollToNewCoordinates) {
                            scrollDelta.y = scrollContainer.scrollTop - newScrollCoordinates;
                        } else {
                            scrollDelta.y = direction === KeyboardCode.Down ? scrollContainer.scrollTop - maxScroll.y : scrollContainer.scrollTop - minScroll.y;
                        }
                        if (scrollDelta.y) {
                            scrollContainer.scrollBy({
                                top: -scrollDelta.y,
                                behavior: scrollBehavior
                            });
                        }
                        break;
                    }
                }
                this.handleMove(event, (0, {imported module ./nodemodules/.bun/@dnd-kit+utilities@3.2.2+b1ab299f0a400331/nodemodules/@dnd-kit/utilities/dist/utilities.esm.js}["add"])((0, {imported module ./nodemodules/.bun/@dnd-kit+utilities@3.2.2+b1ab299f0a400331/nodemodules/@dnd-kit/utilities/dist/utilities.esm.js}["subtract"])(newCoordinates, this.referenceCoordinates), scrollDelta));
            }
        }
    }
    handleMove(event, coordinates) {
        const { onMove } = this.props;
        event.preventDefault();
        onMove(coordinates);
    }
    handleEnd(event) {
        const { onEnd } = this.props;
        event.preventDefault();
        this.detach();
        onEnd();
    }
    handleCancel(event) {
        const { onCancel } = this.props;
        event.preventDefault();
        this.detach();
        onCancel();
    }
    detach() {
        this.listeners.removeAll();
        this.windowListeners.removeAll();
    }
}]
Show More
src/components/programs/program/SemesterTable.tsx (70:34) @ SemesterTable


  68 |           {ues.map(ue => (
  69 |             <UEBlock
> 70 |               key={ue.programUEId}
     |                                  ^
  71 |               ue={ue}
  72 |               semesterIndex={semesterIndex}
  73 |               isDragging={activeUE?.programUEId === ue.prog


  Invalid `prisma.uECourse.updateMany()` invocation: Unique constraint failed on the fields: (`"ueId"`, `"order"`)

order.ts:96:36)
  94 |       const { ueOrders, courseOrders } = buildPayload(program ?? []);
  95 |       const result = await reorderProgramAction({ programId, ueOrders, courseOrders });      
> 96 |       if ("error" in result) throw new Error(result.error ?? "Une erreur est survenue");     
     |                                    ^
  97 |       return true;
  98 |     },
  99 |     onSuccess: async () => {
 POST /zazazsd/direction/academic/programs/34783603-7ef5-4947-b0ee-10129c587328 200 in 1306ms (next.js: 25ms, generate-params: 13ms, application-code: 1281ms)
  └─ ƒ reorderProgramAction({"courseOrders":["[Object]","[Object]","[Object]","... 3 items not stringified"],"programId":"34783603-7ef5-4947-b0ee-10129c587328","ueOrders":["[Object]","[Object]","[Object]"]}) in 1193ms ..//src/services/ue/actions/ue.mutations.ts
[browser] ⨯ unhandledRejection: Error: 
Invalid `prisma.uECourse.updateMany()` invocation:


Unique constraint failed on the fields: (`"ueId"`, `"order"`)
    at useProgramReorder.useMutation[mutation] [as mutationFn] (src\hooks\data\programs\useProgramReorder.ts:96:36)
  94 |       const { ueOrders, courseOrders } = buildPayload(program ?? []);
  95 |       const result = await reorderProgramAction({ programId, ueOrders, courseOrders });      
> 96 |       if ("error" in result) throw new Error(result.error ?? "Une erreur est survenue");     
     |                                    ^
  97 |       return true;
  98 |     },
  99 |     onSuccess: async () => {
 POST /zazazsd/direction/academic/programs/34783603-7ef5-4947-b0ee-10129c587328 200 in 1354ms (next.js: 71ms, generate-params: 18ms, application-code: 1283ms)
  └─ ƒ getNotifications() in 1011ms ..//src/modules/notific