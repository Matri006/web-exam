document.addEventListener('DOMContentLoaded', function() {

    const resources = [
        {
            id: 1,
            name: 'Библиотека иностранной литературы',
            type: 'library',
            address: 'ул. Николоямская, 1',
            coordinates: [55.7445, 37.6464],
            workingHours: 'Пн-Пт: 9:00-21:00, Сб-Вс: 10:00-18:00',
            description: 'Крупнейшая библиотека с литературой на иностранных языках',
            services: 'Книги, журналы, языковые клубы'
        },
        {
            id: 2,
            name: 'Центр русского языка МГУ',
            type: 'education',
            address: 'Ленинские горы, 1',
            coordinates: [55.7039, 37.5286],
            workingHours: 'Пн-Пт: 8:00-20:00',
            description: 'Курсы русского языка для иностранцев',
            services: 'Языковые курсы, тестирование, консультации'
        },
        {
            id: 3,
            name: 'Языковой клуб "Полиглот"',
            type: 'education',
            address: 'ул. Тверская, 22',
            coordinates: [55.7620, 37.6070],
            workingHours: 'Пн-Вс: 10:00-22:00',
            description: 'Клуб для практики иностранных языков',
            services: 'Разговорные клубы, мастер-классы'
        },
        {
            id: 4,
            name: 'Кафе языкового обмена',
            type: 'cafe',
            address: 'ул. Арбат, 45',
            coordinates: [55.7495, 37.5905],
            workingHours: 'Пн-Чт: 12:00-23:00, Пт-Вс: 12:00-00:00',
            description: 'Кафе для практики языков в неформальной обстановке',
            services: 'Языковые встречи, игры, общение'
        },
        {
            id: 5,
            name: 'Международный культурный центр',
            type: 'center',
            address: 'Проспект Мира, 95',
            coordinates: [55.7877, 37.6338],
            workingHours: 'Вт-Вс: 10:00-20:00',
            description: 'Центр международного культурного обмена',
            services: 'Выставки, лекции, языковые курсы'
        }
    ];
    let map;
    let placemarks = [];
    
    function initMap() {
        if (!ymaps) {
            console.error('Yandex Maps API не загружен');
            return;
        }
        
        ymaps.ready(function() {
            map = new ymaps.Map('map', {
                center: [55.751244, 37.618423],
                zoom: 11,
                controls: ['zoomControl', 'fullscreenControl']
            });
            map.controls.add('typeSelector');
            map.controls.add('searchControl');
            const clusterer = new ymaps.Clusterer({
                preset: 'islands#invertedVioletClusterIcons',
                clusterDisableClickZoom: true,
                clusterOpenBalloonOnClick: true,
                clusterBalloonContentLayout: 'cluster#balloonCarousel'
            });

            updateMapMarkers();

            document.getElementById('map-search-btn').addEventListener('click', searchOnMap);
            document.getElementById('map-search').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') searchOnMap();
            });

            document.querySelectorAll('#map-filters input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', updateMapMarkers);
            });
        });
    }
    
    function updateMapMarkers() {
        const activeFilters = {
            education: document.getElementById('filter-education').checked,
            libraries: document.getElementById('filter-libraries').checked,
            centers: document.getElementById('filter-centers').checked,
            cafes: document.getElementById('filter-cafes').checked
        };

        const filteredResources = resources.filter(resource => {
            const typeMap = {
                'education': 'education',
                'library': 'libraries',
                'center': 'centers',
                'cafe': 'cafes'
            };
            return activeFilters[typeMap[resource.type]];
        });

        placemarks.forEach(placemark => map.geoObjects.remove(placemark));
        placemarks = [];
        filteredResources.forEach(resource => {
            const placemark = new ymaps.Placemark(
                resource.coordinates,
                {
                    balloonContentHeader: `<strong>${resource.name}</strong>`,
                    balloonContentBody: `
                        <p><strong>Адрес:</strong> ${resource.address}</p>
                        <p><strong>Часы работы:</strong> ${resource.workingHours}</p>
                        <p><strong>Описание:</strong> ${resource.description}</p>
                        <p><strong>Услуги:</strong> ${resource.services}</p>
                    `,
                    balloonContentFooter: `<em>Тип: ${getResourceTypeName(resource.type)}</em>`,
                    hintContent: resource.name
                },
                {
                    preset: getPresetByType(resource.type),
                    iconColor: getColorByType(resource.type)
                }
            );
            
            placemarks.push(placemark);
            map.geoObjects.add(placemark);
        });
        if (placemarks.length > 0) {
            map.setBounds(map.geoObjects.getBounds());
        }
    }
    
    function getResourceTypeName(type) {
        const types = {
            'education': 'Образовательное учреждение',
            'library': 'Библиотека',
            'center': 'Культурный центр',
            'cafe': 'Языковое кафе'
        };
        return types[type] || 'Неизвестно';
    }
    
    function getPresetByType(type) {
        const presets = {
            'education': 'islands#blueEducationCircleIcon',
            'library': 'islands#blueLibraryIcon',
            'center': 'islands#blueTheaterIcon',
            'cafe': 'islands#blueCafeIcon'
        };
        return presets[type] || 'islands#blueStretchyIcon';
    }
    
    function getColorByType(type) {
        const colors = {
            'education': '#0d6efd',
            'library': '#198754',
            'center': '#6f42c1',
            'cafe': '#fd7e14'
        };
        return colors[type] || '#6c757d';
    }
    
    function searchOnMap() {
        const query = document.getElementById('map-search').value.trim();
        if (!query) return;
        ymaps.geocode(query, {
            results: 10
        }).then(function(res) {
            const firstGeoObject = res.geoObjects.get(0);
            
            if (firstGeoObject) {
                map.geoObjects.each(function(geoObject) {
                    if (geoObject.properties.get('isSearchResult')) {
                        map.geoObjects.remove(geoObject);
                    }
                });
                const searchPlacemark = new ymaps.Placemark(
                    firstGeoObject.geometry.getCoordinates(),
                    {
                        balloonContent: firstGeoObject.getAddressLine(),
                        iconCaption: 'Результат поиска'
                    },
                    {
                        preset: 'islands#redDotIcon',
                        iconColor: '#dc3545'
                    }
                );
                
                searchPlacemark.properties.set('isSearchResult', true);
                map.geoObjects.add(searchPlacemark);

                map.setCenter(firstGeoObject.geometry.getCoordinates(), 15);

                searchPlacemark.balloon.open();
            } else {
                api.showNotification('Местоположение не найдено', 'warning');
            }
        }).catch(function(error) {
            console.error('Geocoding error:', error);
            api.showNotification('Ошибка поиска', 'danger');
        });
    }

    if (typeof ymaps !== 'undefined') {
        initMap();
    } else {
        console.log('Ожидание загрузки Яндекс.Карт...');
        setTimeout(initMap, 1000);
    }
});