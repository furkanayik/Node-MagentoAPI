const clientSearch = require('./elasticClient.js');

const v_bodyAll = { //body for searches without query string
    query: {
        match_all: {}
    }
}

const v_bodyQuery = { //body for searches with query string
    query: {
        query_string: {
            "fields": ["name", "description"], "query": ""
        }
    }
}

const search = async function (indexName, p_size, p_from, p_q) {
    let v_body = v_bodyAll;
    try {
        if (p_q != '') {
            v_bodyQuery.query.query_string.query = "*" + p_q + "*";
            v_body = v_bodyQuery;
        }
        const resSearch = await clientSearch.search({ index: indexName, body: v_body, size: p_size, from: p_from });

        const total = resSearch.body.hits.total.value;
        const items = resSearch.body.hits.hits.map(elm => ({ ...elm._source }));
    }
    catch (e) {
        return { error: e };
    }

    const v_return = { "items": items, "search_params": [], "limit": p_size, "offset": p_from, "total": total };
    if (p_q != '') {
        v_return.search_params[0] = { q: p_q };
    }

    return v_return;
}

module.exports = search;