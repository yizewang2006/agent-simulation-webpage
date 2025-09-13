package Utility;

import java.util.ArrayList;

public class DataStruct_unReserveProperty 
{
	public int property_ID;
	public ArrayList<Double> value_set = new ArrayList<Double>();
	public ArrayList<Double> weight_set = new ArrayList<Double>();
	
	DataStruct_unReserveProperty(int p_ID, double v, double w)
	{
		this.property_ID = p_ID;
		this.value_set.add(v);
		this.weight_set.add(w);
	}

	
}
