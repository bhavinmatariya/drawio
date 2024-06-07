var filtermodal = document.getElementById("filterDataModal");
var selectedcellData = '';
var selectedSource = '';
var selectedWorkspace = [];
var getQueryRulesData = '';
var span = document.getElementById("close-filterModal");
var filterOkBtn = document.getElementById("filterOkBtn");
var validateBtn = document.getElementById("validateBtn");

filterOkBtn.onclick = function () {
  if ($('#builder').data('queryBuilder')) {
    var result = $('#builder').queryBuilder('getRules');
    if (!$.isEmptyObject(result)) {
      let selectedFilterData = {
        filterDataBuilderQuery: {...result},
        selectedSource:{...JSON.parse(selectedSource)}
      }
      selectedcellData['selectedFilterData']=JSON.stringify({...selectedFilterData});
    }
  }

  filtermodal.style.display = "none";
}

validateBtn.onclick = async function () {
  if ($('#builder').data('queryBuilder')) {

    var result = $('#builder').queryBuilder('getRules');
    if (!$.isEmptyObject(result)) {
      getQueryRulesData = result;
    } else {
      alert('No query defined.');
      return;
    }
    if (!selectedWorkspace.length) {
      alert("workspace data not found");
      return;
    }
    const isWorkSpaceContainNull = selectedWorkspace.some(value => value === null);
    if (isWorkSpaceContainNull) {
      alert("workspace data not found for all connected source");
      return;
    }

    const selectedWorkspaceString = JSON.stringify(selectedWorkspace[0]);
    const queryRuleDataString = JSON.stringify(getQueryRulesData);

    const selectedWorkspaceUtf8Bytes = new TextEncoder().encode(selectedWorkspaceString);
    const queryRuleDataUtf8Bytes = new TextEncoder().encode(queryRuleDataString);

    const selectedWorkspaceEncoded = btoa(String.fromCharCode(...selectedWorkspaceUtf8Bytes));
    const queryRuleDataEncoded = btoa(String.fromCharCode(...queryRuleDataUtf8Bytes));

    const payload = {
      "base64": selectedWorkspaceEncoded,
      "rules": queryRuleDataEncoded
    };
    $('#filter-loader').show();
    const response = await applyWorkflowRules(payload);
    if(response) {
      $('#filter-loader').hide();
      $('#validateOutput').css('display', 'block');
      $('.validate-copy-btn').css('display', 'block');
      $('#validateOutput').text(JSON.stringify(JSON.parse(response.json), null, 2));
    }
  }
}

async function applyWorkflowRules(payload) {
  const url = 'https://deva.instantar.io/api/api/v2.0/applyworkflowrules';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;  // Re-throw the error so it can be caught by the caller
  }
}


span.onclick = function () {
  closeFilterModal();
}

window.onclick = function (event) {
  if (event.target == filtermodal) {
    closeFilterModal();
  }
}

function openFilterModal() {
  filtermodal.style.display = "block";

    $('#btn-get-query').css('display', 'none');
    $('#output').css('display', 'none');
    $('#validateOutput').css('display', 'none');
    $('.copy-btn').css('display', 'none');
    $('.validate-copy-btn').css('display', 'none');

  if ($('#builder').data('queryBuilder')) {
    $('#builder').queryBuilder('destroy');
  }

  if (selectedcellData?.edges?.length) {
    var resultCell = traverseGraph(selectedcellData);
    if(resultCell) {
      if (resultCell.length === 1) {
        $('#filter-select-source-wrapper').css('display', 'none');
        $('#builder').css('margin-top', '8px');
        let cellAttributesData = null;
        cellAttributesData = getJsonDataFromCell(resultCell[0]);
        if (cellAttributesData?.jsonData) {
          selectedSource = JSON.stringify(Object.values(cellAttributesData.jsonData)[0]);
          selectedWorkspace[0] = cellAttributesData.selectedworkSpaceData;
          const filters = jsonToFilterArray(cellAttributesData.jsonData);
          $(document).ready(function () {

            if ($('#builder').data('queryBuilder')) {
              $('#builder').queryBuilder('destroy');
            }
            $('#builder').queryBuilder({
              filters
            });
            $('#btn-get-query').css('display', 'block');
            $('#btn-get-query').on('click', function () {
              var result = $('#builder').queryBuilder('getRules');
              if (!$.isEmptyObject(result)) {
                $('#output').css('display', 'block');
                $('.copy-btn').css('display', 'block');
                $('#output').text(JSON.stringify(result, null, 2));
                getQueryRulesData = result;
              } else {
                $('#output').text('No query defined.');
              }
            });
            const selectedSourceNew = JSON.parse(selectedSource);
            const selectedSourceFromCellNew = Object.values(JSON.parse(selectedcellData.selectedFilterData).selectedSource);   
            if(selectedcellData?.selectedFilterData && deepEqual(selectedSourceNew, selectedSourceFromCellNew) && JSON.parse(selectedcellData.selectedFilterData).filterDataBuilderQuery){
              $('#builder').queryBuilder('setRules', JSON.parse(selectedcellData.selectedFilterData).filterDataBuilderQuery);
            }
            setAddDeleteRuleOrGroup();
            $('#builder').on('afterAddRule.queryBuilder', function(e, rule) {
              setAddDeleteRuleOrGroup();
            });
          });
        }
        else {
          filtermodal.style.display = "none";
          alert("source data not found");
        }
      }
      else {
        let cellAttributesData = null;
        let allSourceDataJSON = [];
        for (var i = 0; i < resultCell.length; i++) {
          cellAttributesData = getJsonDataFromCell(resultCell[i]);
          if (cellAttributesData.jsonData) {
            allSourceDataJSON.push(cellAttributesData.jsonData);
            selectedWorkspace.push(cellAttributesData.selectedworkSpaceData);
          }
        }
        if (allSourceDataJSON?.length) {
          $('#filter-select-source-wrapper').css('display', 'flex');
          const select = $('#select-source');
          select.empty();
  
            const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.text = "Select an option";
            defaultOption.disabled = true;
            defaultOption.selected = true;
            select.append(defaultOption);
  
  
          allSourceDataJSON.forEach(function (item) {
            const parentKey = Object.keys(item)[0];
            const value = JSON.stringify(item[parentKey]);
  
            const option = document.createElement("option");
            option.value = value;
            option.text = parentKey;
  
            select.append(option);
          });
  
          $('#select-source').on('change', function () {
            $('#output').css('display', 'none');
            $('#validateOutput').css('display', 'none');
            $('.copy-btn').css('display', 'none');
            $('.validate-copy-btn').css('display', 'none');
            const selectedValue = $(this).val();
            selectedSource = selectedValue;
            if (selectedValue) {
              const filters = jsonToFilterArray(JSON.parse(selectedValue), true);
              $(document).ready(function () {
                if ($('#builder').data('queryBuilder')) {
                  $('#builder').queryBuilder('destroy');
                }
                $('#builder').queryBuilder({
                  filters
                });
                $('#btn-get-query').css('display', 'block');
                $('#btn-get-query').on('click', function () {
                  var result = $('#builder').queryBuilder('getRules');
                  if (!$.isEmptyObject(result)) {
                    $('#output').css('display', 'block');
                    $('.copy-btn').css('display', 'block');
                    $('#output').text(JSON.stringify(result, null, 2));
                    getQueryRulesData = result;
                  } else {
                    $('#output').text('No query defined.');
                  }
                });
                const selectedSourceNew = JSON.parse(selectedSource);
                const selectedSourceFromCellNew = Object.values(JSON.parse(selectedcellData.selectedFilterData).selectedSource);
                if(selectedcellData?.selectedFilterData && deepEqual(selectedSourceNew, selectedSourceFromCellNew) && JSON.parse(selectedcellData.selectedFilterData).filterDataBuilderQuery){
                  $('#builder').queryBuilder('setRules', JSON.parse(selectedcellData.selectedFilterData).filterDataBuilderQuery);
                }
                setAddDeleteRuleOrGroup();
                $('#builder').on('afterAddRule.queryBuilder', function(e, rule) {
                  setAddDeleteRuleOrGroup();
                });
              });
            }
          });
          if(selectedcellData?.selectedFilterData && JSON.parse(selectedcellData.selectedFilterData).selectedSource){
            const selectedValue = JSON.parse(selectedcellData.selectedFilterData).selectedSource;
            select.val(JSON.stringify(selectedValue)).trigger('change');
          }
        }
        else {
          filtermodal.style.display = "none";
          alert("source data not found");
        }
      }
    }
  }
  else {
    filtermodal.style.display = "none";
  }
}

function closeFilterModal() {
  filtermodal.style.display = "none";
  getQueryRulesData = null;
  selectedWorkspace = [];
  if ($('#builder').data('queryBuilder')) {
    $('#builder').queryBuilder('destroy');
  }
}


function filtermodalOpen(cellData) {
  selectedcellData = cellData;
  openFilterModal();
}

function getJsonDataFromCell(cell) {
  if (cell && cell.getValue()) {
    var value = cell.getValue();

    if (mxUtils.isNode(value)) {
      var jsonDataString = value.getAttribute('jsonData');
      var selectedworkSpaceData = value.getAttribute('selectedworkSpaceData');
      var jsonData;
      try {
        jsonData = JSON.parse(jsonDataString);
      } catch (e) {
        jsonData = {'New' : { [jsonDataString] : 'string'}};
      }

      return {jsonData,selectedworkSpaceData : JSON.parse(selectedworkSpaceData)};
    } else {
      console.error("The cell value is not an XML node.");
    }
  } else {
    console.error("The cell is empty or does not have a value.");
  }
  return null;
}

function setAddDeleteRuleOrGroup() {
  const addRuleBtn = document.querySelectorAll('.btn-xs.btn-success[data-add="rule"]');
  const addGroupBtn = document.querySelectorAll('.btn-xs.btn-success[data-add="group"]');
  const deleteBtn = document.querySelectorAll('.btn-xs.btn-danger[data-delete="rule"]');
  if (addRuleBtn) {
    addRuleBtn.forEach((ele) => {
      ele.innerHTML = `<i class="glyphicon glyphicon-plus"></i> Rule`;
    });
  }
  if (addGroupBtn) {
    addGroupBtn.forEach((ele) => {
      ele.innerHTML = `<i class="glyphicon glyphicon-plus-sign"></i> Group`;
    });
  }
  if(deleteBtn) {
    deleteBtn.forEach((ele) => {
      ele.innerHTML = `<i class="fa fa-trash">`;
    });
  }
}

function mapType(type) {
  switch(type) {
      case 'number':
          return 'integer';
      case 'string':
          return 'string';
      case 'boolean':
          return 'boolean';
      default:
          return 'string';
  }
}

function jsonToFilterArray(json, isMultipleSourceData = false) {
  let filters = [];
  const sourcBlockData = isMultipleSourceData ? json : Object.values(json)[0];
  if (sourcBlockData && Array.isArray(sourcBlockData)) {
    filters.push(...sourcBlockData.map(source => ({
      id: source.id,
      label: formatLabel(source.value),
      type: mapType(source[source.value])
    })));
  }
  return filters;
}

function formatLabel(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ') : '';
}

function deepEqual(a, b) {
  if (a === b) {
      return true;
  }
  if (typeof a !== 'object' || typeof b !== 'object' || a == null || b == null) {
      return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) {
      return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
      return false;
  }

  for (const key of keysA) {
      if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
          return false;
      }
  }

  return true;
}

